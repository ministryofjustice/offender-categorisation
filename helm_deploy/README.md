
### Example test deploy command

```
helm --namespace offender-categorisation-dev  --tiller-namespace offender-categorisation-dev upgrade offender-categorisation ./offender-categorisation/ --install --values=values-dev.yaml --values=secrets-example.yaml --dry-run --debug
```

Test template output:

```
helm template ./offender-categorisation/ --values=values-dev.yaml --values=secrets-example.yaml
```

### Rolling back a release
Find the revision number for the deployment you want to roll back:
```
helm --tiller-namespace offender-categorisation-dev history offender-categorisation -o yaml
```
(note, each revision has a description which has the app version and circleci build URL)

Rollback
```
helm --tiller-namespace offender-categorisation-dev rollback offender-categorisation [INSERT REVISION NUMBER HERE] --wait
```

### Helm init

```
helm init --tiller-namespace offender-categorisation-dev --service-account tiller --history-max 200
```

### Setup Lets Encrypt cert

```
kubectl -n offender-categorisation-dev apply -f certificate-dev.yaml
kubectl -n offender-categorisation-preprod apply -f certificate-preprod.yaml
kubectl -n offender-categorisation-prod apply -f certificate-prod.yaml
```
