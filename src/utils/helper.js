export const validatePassword = (password) => {
  if (!password) {
    return "Le mot de passe est obligatoire";
  }

  return "";
};

export const validateUsername = (username) => {
  if (!username) {
    return "Le nom est obligatoire";
  }
  return "";
};
