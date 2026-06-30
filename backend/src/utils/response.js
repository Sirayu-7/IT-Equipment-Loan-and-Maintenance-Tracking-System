// Consistent JSON response helpers

const success = (res, data = null, message = 'Success', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

const paginated = (res, data, pagination, message = 'Success') => {
  return res.status(200).json({
    success: true,
    message,
    data,
    pagination,
  });
};

const created = (res, data = null, message = 'Created successfully') => {
  return res.status(201).json({
    success: true,
    message,
    data,
  });
};

const noContent = (res, message = 'No content') => {
  return res.status(204).json({
    success: true,
    message,
  });
};

const error = (res, message = 'Internal server error', statusCode = 500, errors = null) => {
  const response = {
    success: false,
    message,
  };
  if (errors) response.errors = errors;
  return res.status(statusCode).json(response);
};

module.exports = {
  success,
  paginated,
  created,
  noContent,
  error,
};