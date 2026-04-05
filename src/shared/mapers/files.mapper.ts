const fileToUrl = (file: File) => {
  return URL.createObjectURL(file);
};

const filesToUrl = (file: File[]) => {
  return file.map((file) => fileToUrl(file));
};

export default {
  filesToUrl,
  fileToUrl,
};
