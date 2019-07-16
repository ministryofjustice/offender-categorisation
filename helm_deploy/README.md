
### Example deploy command
```
helm --namespace offender-categorisation-dev  --tiller-namespace offender-categorisation-dev upgrade offender-categorisation ./offender-categorisation/ --install --values=values-dev.yaml --values=example-secrets.yaml
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
