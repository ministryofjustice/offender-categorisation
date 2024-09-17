This folder contains scripts required to export all the Cat Tool stats as requested under SI-1206.

The majority of the stats that are generated can be found via the Supervisor dashboard.

However, due to lack of memory / cpu / fast disk, it is currently not possible to export these from the front end for
the entire male estate.

There are some extra stats and customisations of the stats that were also required as
part of SI-1206.

## How To Use

The scripts need to exist in the `dist` directory of the resulting Docker image.

This should be taken care of, automatically, as part of the Docker build.

From inside the running Docker container (k8s pod), execute the following:

```shell
/app/dist/scripts/tprs-data-extract$ node \
  tprs-stats-extractor.js \
  START_DATE \
  END_DATE \
  USERNAME
```

You should provide a `START_DATE` and `END_DATE` in the format YYYY-MM-DD.

You should provide a valid username that has permissions to call the Prisoner Search API.

You may also call the script without any arguments.

This will use a default start date of `'2000-01-01'`, and an end date of Today.
