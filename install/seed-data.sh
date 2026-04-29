#!/usr/bin/env bash
# ------------------------------------------------------------------
# seed-data.sh
#
# Post-deploy script that patches CR status subresources and seeds
# sample data (Model Registry models). Works on both Kind and
# OpenShift clusters.
#
# Called automatically by deploy-kind-helm.sh / deploy-openshift-helm.sh;
# can also be run standalone to re-seed after a manual cleanup.
#
# Required env vars (with defaults):
#   NAMESPACE        – dashboard namespace       (odh-dashboard)
#   SAMPLE_NS        – sample project namespace  (sample-project)
# ------------------------------------------------------------------
set -euo pipefail

NAMESPACE="${NAMESPACE:-odh-dashboard}"
SAMPLE_NS="${SAMPLE_NS:-sample-project}"

echo ">>> Patching status subresources..."

# --- DSPA (DataSciencePipelinesApplication) ---
kubectl patch datasciencepipelinesapplication dspa -n "${SAMPLE_NS}" \
  --type merge --subresource=status \
  -p '{
    "status":{
      "conditions":[
        {"type":"Ready","status":"True","lastTransitionTime":"2025-01-15T10:00:00Z","reason":"MinimumReplicasAvailable","message":"Mock DSPA is ready"},
        {"type":"APIServerReady","status":"True","lastTransitionTime":"2025-01-15T10:00:00Z","reason":"Ready","message":"API server is ready"}
      ],
      "components":{
        "apiServer":{"url":"http://ds-pipeline-dspa.'"${SAMPLE_NS}"'.svc.cluster.local:8443"},
        "mlmdProxy":{"url":"http://ds-pipeline-mlmd.'"${SAMPLE_NS}"'.svc.cluster.local:8443"}
      }
    }
  }' 2>/dev/null || true

# --- InferenceServices ---
kubectl patch inferenceservice llama-3-8b -n "${SAMPLE_NS}" \
  --type merge --subresource=status \
  -p '{
    "status":{
      "conditions":[{"type":"Ready","status":"True","lastTransitionTime":"2025-01-15T10:00:00Z","reason":"Ready","message":"Inference service is ready"}],
      "url":"http://llama-3-8b.'"${SAMPLE_NS}"'.svc.cluster.local",
      "modelStatus":{"states":{"activeModelState":"Loaded"}}
    }
  }' 2>/dev/null || true

kubectl patch inferenceservice mistral-7b -n "${SAMPLE_NS}" \
  --type merge --subresource=status \
  -p '{
    "status":{
      "conditions":[{"type":"Ready","status":"False","lastTransitionTime":"2025-01-15T10:00:00Z","reason":"RevisionNotReady","message":"Waiting for model to load"}],
      "modelStatus":{"states":{"activeModelState":"Loading"}}
    }
  }' 2>/dev/null || true

# --- DataScienceCluster ---
kubectl patch datasciencecluster default-dsc \
  --type merge --subresource=status \
  -p '{
    "status":{
      "conditions":[
        {"type":"ModelsAsServiceReady","status":"True","lastTransitionTime":"2025-01-15T10:00:00Z","reason":"Ready","message":"MaaS is ready"},
        {"type":"Available","status":"True","lastTransitionTime":"2025-01-15T10:00:00Z","reason":"Available"}
      ],
      "components":{
        "dashboard":{"managementState":"Managed"},
        "kserve":{"managementState":"Managed"},
        "modelregistry":{"managementState":"Managed","registriesNamespace":"'"${NAMESPACE}"'"},
        "kueue":{"managementState":"Managed"},
        "ray":{"managementState":"Managed"},
        "trainingoperator":{"managementState":"Managed"},
        "workbenches":{"managementState":"Managed"},
        "aipipelines":{"managementState":"Managed"}
      }
    }
  }' 2>/dev/null || true

# --- MaaS CRs status patches ---
for sub in premium-team-sub basic-team-sub; do
  kubectl patch maassubscription "${sub}" -n "${NAMESPACE}" \
    --type merge --subresource=status \
    -p '{"status":{"phase":"Active","message":"successfully reconciled"}}' 2>/dev/null || true
done

for policy in premium-team-policy basic-team-policy; do
  kubectl patch maasauthpolicy "${policy}" -n "${NAMESPACE}" \
    --type merge --subresource=status \
    -p '{"status":{"phase":"Active","message":"successfully reconciled"}}' 2>/dev/null || true
done

for modelref in granite-3-8b-instruct flan-t5-small; do
  kubectl patch maasmodelref "${modelref}" -n "${NAMESPACE}" \
    --type merge --subresource=status \
    -p '{"status":{"phase":"Ready","endpoint":"https://'"${modelref}"'.example.com"}}' 2>/dev/null || true
done

# --- Seed Model Registry ---
if kubectl get deploy model-registry-server -n "${NAMESPACE}" &>/dev/null; then
  echo ">>> Waiting for Model Registry server..."
  kubectl rollout status deploy/model-registry-server -n "${NAMESPACE}" --timeout=60s 2>/dev/null || true

  MR_POD=$(kubectl get pod -n "${NAMESPACE}" -l app=model-registry-server \
    -o jsonpath='{.items[0].metadata.name}' 2>/dev/null)

  if [ -n "${MR_POD}" ]; then
    MR_URL="http://model-registry.${NAMESPACE}.svc.cluster.local:8080/api/model_registry/v1alpha3"

    existing=$(kubectl exec -n "${NAMESPACE}" deploy/odh-dashboard -- \
      curl -s "${MR_URL}/registered_models" 2>/dev/null \
      | grep -o '"size":[0-9]*' | grep -o '[0-9]*') || existing="0"

    if [ "${existing}" = "0" ]; then
      echo ">>> Seeding Model Registry with sample models..."
      for model_json in \
        '{"name":"granite-8b-code-instruct","description":"IBM Granite 8B model fine-tuned for code generation and understanding"}' \
        '{"name":"llama-3-8b-instruct","description":"Meta Llama 3 8B instruction-tuned large language model"}' \
        '{"name":"mistral-7b-instruct-v0.3","description":"Mistral AI 7B instruction-following model"}'; do

        model_id=$(kubectl exec -n "${NAMESPACE}" deploy/odh-dashboard -- \
          curl -s -X POST "${MR_URL}/registered_models" \
          -H "Content-Type: application/json" -d "${model_json}" 2>/dev/null \
          | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4) || true

        if [ -n "${model_id}" ]; then
          model_name=$(echo "${model_json}" | grep -o '"name":"[^"]*"' | cut -d'"' -f4)
          kubectl exec -n "${NAMESPACE}" deploy/odh-dashboard -- \
            curl -s -X POST "${MR_URL}/registered_models/${model_id}/versions" \
            -H "Content-Type: application/json" \
            -d "{\"name\":\"v1.0\",\"description\":\"Initial release\",\"state\":\"LIVE\",\"registeredModelId\":\"${model_id}\"}" \
            >/dev/null 2>&1 || true
          echo "    Seeded model: ${model_name} (id=${model_id})"
        fi
      done
    else
      echo ">>> Model Registry already has ${existing} models, skipping seed."
    fi
  fi
fi

echo ">>> Seed data complete."
