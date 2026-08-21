const Joi = require('joi');

const validateRequest = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(
      {
        body: req.body,
        query: req.query,
        params: req.params
      },
      { abortEarly: false }
    );
    
    if (error) {
      error.isJoi = true;
      error.details = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));
      return next(error);
    }
    
    req.validated = value;
    next();
  };
};

module.exports = {
  validateRequest,
  schemas: {
    register: Joi.object({
      body: Joi.object({
        username: Joi.string().alphanum().min(3).max(50).required(),
        email: Joi.string().email().required(),
        password: Joi.string().min(8).required(),
        phone: Joi.string().required(),
        first_name: Joi.string().max(100),
        last_name: Joi.string().max(100),
        date_of_birth: Joi.date().required(),
        country: Joi.string().required()
      })
    }),
    
    login: Joi.object({
      body: Joi.object({
        email: Joi.string().email().required(),
        password: Joi.string().required()
      })
    }),
    
    playNow: Joi.object({
      body: Joi.object({
        level_id: Joi.number().required()
      })
    }),
    
    deposit: Joi.object({
      body: Joi.object({
        amount: Joi.number().positive().required()
      })
    })
  }
};
