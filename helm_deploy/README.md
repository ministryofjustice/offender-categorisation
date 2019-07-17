
### Example test deploy command

```
helm --namespace offender-categorisation-dev  --tiller-namespace offender-categorisation-dev upgrade offender-risk-profiler ./offender-risk-profiler/ --install --values=values-dev.yaml --values=secrets-example.yaml --dry-run --debug
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
