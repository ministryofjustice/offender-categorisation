module.exports = formService => async (req, res, next) => {
  try {
    const formData = await formService.getFormResponse('user1')

    res.locals.formObject = formData.form_response || {}
    res.locals.formId = formData.id

    next()
  } catch (error) {
    // TODO proper error handling
    res.redirect('/')
  }
}
