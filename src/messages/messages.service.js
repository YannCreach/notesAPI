/**
 * Service Methods
 */

export const getPublicMessage = () => {
  return {
    message: "The API doesn't require an access token to share this message.",
  };
};

export const getProtectedMessage = () => {
  return {
    message: "The API successfully validated your access token.",
  };
};
