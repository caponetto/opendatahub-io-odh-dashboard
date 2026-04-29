#!/usr/bin/env bash
# Shared helpers for Helm-based deploy scripts.

# clean_ns <namespace>
# Deletes all known dashboard-managed resources from a namespace.
clean_ns() {
  local ns="$1"
  for kind in deployment service configmap secret ingress serviceaccount role rolebinding; do
    kubectl delete "$kind" --all -n "$ns" --ignore-not-found 2>&1 | grep -v "^No resources found" || true
  done
  for kind in odhdashboardconfig auth hardwareprofile odhapplication odhdocument \
              servingruntime inferenceservice notebook datasciencepipelinesapplication \
              datasciencecluster imagestream route template trainjob rayjob \
              clusterqueue localqueue workload modelregistry pvc; do
    kubectl delete "$kind" --all -n "$ns" --ignore-not-found 2>&1 | grep -v "^No resources found" || true
  done
}

# inject_namespace <namespace>
# Reads Helm-rendered YAML from stdin and injects metadata.namespace on
# namespaced resources that don't already declare one.
# Cluster-scoped kinds (Namespace, ClusterRole, etc.) are left untouched.
inject_namespace() {
  local ns="$1"
  awk -v ns="${ns}" '
    /^---/ { flush(); next }
    { lines[++n] = $0 }
    END { flush() }
    function flush() {
      if (n == 0) return
      kind = ""; has_ns = 0
      for (i = 1; i <= n; i++) {
        if (lines[i] ~ /^kind:/) { split(lines[i], a, ": "); kind = a[2] }
        if (lines[i] ~ /^  namespace:/) has_ns = 1
      }
      cluster_scoped = (kind == "Namespace" || kind == "ClusterRole" || kind == "ClusterRoleBinding" || kind == "CustomResourceDefinition")
      print "---"
      for (i = 1; i <= n; i++) {
        print lines[i]
        if (!has_ns && !cluster_scoped && lines[i] ~ /^metadata:/) {
          print "  namespace: " ns
          has_ns = 1
        }
      }
      delete lines; n = 0
    }
  '
}

# Third-party images pinned for reproducibility.
# Both deploy scripts and push-images.sh share these.
MR_SERVER_IMAGE="${MR_SERVER_IMAGE:-ghcr.io/kubeflow/model-registry/server:v0.3.8}"
PG_IMAGE="${PG_IMAGE:-postgres:16}"
BUSYBOX_IMAGE="${BUSYBOX_IMAGE:-busybox:1.37}"
PERSES_IMAGE="${PERSES_IMAGE:-persesdev/perses:v0.42.1}"
PROM_IMAGE="${PROM_IMAGE:-prom/prometheus:v2.53.0}"
THANOS_IMAGE="${THANOS_IMAGE:-quay.io/thanos/thanos:v0.36.1}"
