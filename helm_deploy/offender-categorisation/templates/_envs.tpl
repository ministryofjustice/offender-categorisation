{{/* vim: set filetype=mustache: */}}
{{/*
Environment variables for web and worker containers
*/}}
{{- define "deployment.envs" }}
env:
  - name: DB_PASS
    valueFrom:
      secretKeyRef:
        name: dps-rds-instance-output
        key: database_password

  - name: DB_USER
    valueFrom:
      secretKeyRef:
        name: dps-rds-instance-output
        key: database_username

  - name: DB_SERVER
    valueFrom:
      secretKeyRef:
        name: dps-rds-instance-output
        key: rds_instance_address

  - name: DB_NAME
    valueFrom:
      secretKeyRef:
        name: dps-rds-instance-output
        key: database_name

  - name: DB_SSL_ENABLED
    value: "true"

  - name: API_CLIENT_ID
    valueFrom:
      secretKeyRef:
        name: {{ template "app.name" . }}
        key: API_CLIENT_ID

  - name: API_CLIENT_SECRET
    valueFrom:
      secretKeyRef:
        name: {{ template "app.name" . }}
        key: API_CLIENT_SECRET

  - name: APPINSIGHTS_INSTRUMENTATIONKEY
    valueFrom:
      secretKeyRef:
        name: {{ template "app.name" . }}
        key: APPINSIGHTS_INSTRUMENTATIONKEY

  - name: GOOGLE_ANALYTICS_ID
    valueFrom:
      secretKeyRef:
        name: {{ template "app.name" . }}
        key: GOOGLE_ANALYTICS_ID

  - name: SESSION_SECRET
    valueFrom:
      secretKeyRef:
        name: {{ template "app.name" . }}
        key: SESSION_SECRET

  - name: NOMIS_AUTH_URL
    value: {{ .Values.env.NOMIS_AUTH_URL | quote }}

  - name: NOMIS_OAUTH_PUBLIC_KEY
    value: {{ .Values.env.NOMIS_OAUTH_PUBLIC_KEY | quote }}

  - name: ELITE2API_ENDPOINT_URL
    value: {{ .Values.env.ELITE2API_ENDPOINT_URL | quote }}

  - name: RISK_PROFILER_ENDPOINT_URL
    value: {{ .Values.env.RISK_PROFILER_ENDPOINT_URL | quote }}

  - name: INGRESS_URL
    value: 'https://{{ .Values.ingress.host }}'

  - name: DPS_URL
    value: {{ .Values.env.DPS_URL | quote }}


  - name: RP_QUEUE_ACCESS_KEY_ID
    valueFrom:
      secretKeyRef:
        name: rp-sqs-instance-output
        key: access_key_id

  - name: RP_QUEUE_SECRET_ACCESS_KEY
    valueFrom:
      secretKeyRef:
        name: rp-sqs-instance-output
        key: secret_access_key

  - name: RP_QUEUE_URL
    valueFrom:
      secretKeyRef:
        name: rp-sqs-instance-output
        key: sqs_rpc_url

  - name: RP_DL_QUEUE_ACCESS_KEY_ID
    valueFrom:
      secretKeyRef:
        name: rp-sqs-dl-instance-output
        key: access_key_id

  - name: RP_DL_QUEUE_SECRET_ACCESS_KEY
    valueFrom:
      secretKeyRef:
        name: rp-sqs-dl-instance-output
        key: secret_access_key

  - name: RP_DL_QUEUE_URL
    valueFrom:
      secretKeyRef:
        name: rp-sqs-dl-instance-output
        key: sqs_rpc_url


  - name: EVENT_QUEUE_ACCESS_KEY_ID
    valueFrom:
      secretKeyRef:
        name: ocu-events-sqs-instance-output
        key: access_key_id

  - name: EVENT_QUEUE_SECRET_ACCESS_KEY
    valueFrom:
      secretKeyRef:
        name: ocu-events-sqs-instance-output
        key: secret_access_key

  - name: EVENT_QUEUE_URL
    valueFrom:
      secretKeyRef:
        name: ocu-events-sqs-instance-output
        key: url

  - name: EVENT_DL_QUEUE_ACCESS_KEY_ID
    valueFrom:
      secretKeyRef:
        name: ocu-events-sqs-dl-instance-output
        key: access_key_id

  - name: EVENT_DL_QUEUE_SECRET_ACCESS_KEY
    valueFrom:
      secretKeyRef:
        name: ocu-events-sqs-dl-instance-output
        key: secret_access_key

  - name: EVENT_DL_QUEUE_URL
    valueFrom:
      secretKeyRef:
        name: ocu-events-sqs-dl-instance-output
        key: url


  - name: REDIS_HOST
    valueFrom:
      secretKeyRef:
        name: oc-elasticache-redis
        key: primary_endpoint_address

  - name: REDIS_AUTH_TOKEN
    valueFrom:
      secretKeyRef:
        name: oc-elasticache-redis
        key: auth_token

  - name: REDIS_TLS_ENABLED
    value: "true"

{{- end -}}
