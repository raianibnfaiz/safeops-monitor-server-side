const parseBooleanEnv = (value, defaultValue = false) => {
  if (value === undefined) {
    return defaultValue;
  }

  return value === 'true';
};

const parseNumberEnv = (value, defaultValue) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : defaultValue;
};

module.exports = {
  parseBooleanEnv,
  parseNumberEnv,
};
