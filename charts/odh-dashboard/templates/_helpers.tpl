{{/*
Chart name, truncated to 63 chars.
*/}}
{{- define "odh-dashboard.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Fully qualified app name. Uses release name + chart name, truncated to 63 chars.
*/}}
{{- define "odh-dashboard.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- if contains $name .Release.Name }}
{{- .Release.Name | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}
{{- end }}

{{/*
Common labels applied to every resource.
*/}}
{{- define "odh-dashboard.labels" -}}
app.kubernetes.io/name: {{ include "odh-dashboard.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
app.kubernetes.io/version: {{ .Values.image.tag | default .Chart.AppVersion | quote }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
helm.sh/chart: {{ printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Selector labels for pods.
*/}}
{{- define "odh-dashboard.selectorLabels" -}}
deployment: odh-dashboard
{{- end }}

{{/*
ServiceAccount name.
*/}}
{{- define "odh-dashboard.serviceAccountName" -}}
odh-dashboard
{{- end }}

{{/*
Sample/project namespace. Defaults to .Release.Namespace when sampleNamespace is empty.
*/}}
{{- define "odh-dashboard.sampleNamespace" -}}
{{- default .Release.Namespace .Values.sampleNamespace }}
{{- end }}
