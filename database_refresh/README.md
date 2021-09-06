# Scheduled RDS Snapshots

This folder contains the following kubernetes config:

- `01-configmap-db-snapshot-script.yaml` Defines the bash script used to perform the rds snapshots, and clean up of older ones
- `02-cronjob.yaml` Defines the cronjob which launches the job on a scheduled basis (see cron value in this file)
- `03-prometheus-alert.yaml` Define alert which will tell us if the snapshot job failed, alert sent to `#dps_alerts`

Also:

- `rds-snapshot-job.yaml` Can be used to create one off snapshots on an adhoc basis.

### Prerequisite:

For this job to work the AWS IAM creds, exported by the terraform module, need to be exported into the namespace as secrets.  These creds have limited permissions which allow for managing snapshots.

See module outputs:
- `access_key_id`
- `secret_access_key`

Source code here: <https://github.com/ministryofjustice/cloud-platform-terraform-rds-instance/>

E.g. <https://github.com/ministryofjustice/cloud-platform-environments/blob/master/namespaces/live-1.cloud-platform.service.justice.gov.uk/offender-categorisation-preprod/resources/rds.tf#L52>

Also required module output is `rds_instance_address` which is mapped to env var `DB_INSTANCE`.

### Overview

The snapshot job runs on a schedule determined in `02-cronjob.yaml`.  Two variables can be configured in the `01-configmap-db-snapshot-script.yaml`:

- `SNAPSHOT_PREFIX`, prefix for snapshot name, snapshot is postfixed with epoch timestamp.
- `RETENTION`, the number of snapshots to keep.

### Installation of cronjob

```bash
kubectl -n [namespace] apply -f 01-configmap-db-snapshot-script.yaml
kubectl -n [namespace] apply -f 02-cronjob.yaml
```

Check that `03-prometheus-alert.yaml` has the correct namespace specified, update the the rule if needed:

```bash
kubectl -n [namespace] apply -f 03-prometheus-alert.yaml
```

### Run an adhoc RDS snapshot

Create the job:

```bash
kubectl -n [namespace] apply -f rds-snapshot-adhoc-job.yaml
```

Check the job is running, and see what pods have been created:

```bash
kubectl -n [namespace] describe jobs rds-snapshot
```

Get the logs from the pod:

```bash
kubectl -n [namespace] logs [pod name]
```

When finished, delete the job:

```bash
kubectl -n [namespace] delete jobs.batch rds-snapshot
```

### Troubleshooting

Get or Describe cron job:

```bash
kubectl -n [namespace] get cronjobs.batch
kubectl -n [namespace] describe cronjobs.batch rds-snapshot-job
```

List of previously run jobs:

```bash
kubectl -n [namespace] get jobs
```

View details of job and find pod names:

```bash
kubectl -n [namespace] describe jobs [name of job]
```

Get logs from last run:

```bash
kubectl -n [namespace] logs [name of pod]
```