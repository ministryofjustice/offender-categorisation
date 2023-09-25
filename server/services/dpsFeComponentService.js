module.exports = function createDpsFeComponentService(dpsFeComponentsClientBuilder) {
  function getComponent(component, context) {
    const client = dpsFeComponentsClientBuilder(context)
    return client.getComponent(component)
  }

  return {
    getComponent,
  }
}
