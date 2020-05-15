/**
 * Builds an array of array page objects to be used for matching against
 * page URLs in order to determine whether a page is an array page, and if so,
 * which index in the array it represents.
 *
 * @param {Object} formConfig - The config used to build the form.
 * @returns {Array} Array of array pages with regex patterns.
 */
export const createArrayPageObjects = formConfig => {
  // Pull pages from the form config that have an arrayPath.
  const arrayPages = Object.values(formConfig.chapters || {}).reduce(
    (acc, { pages }) => [
      ...acc,
      ...Object.values(pages).filter(({ arrayPath }) => arrayPath),
    ],
    [],
  );

  return (arrayPages || []).map(({ arrayPath, path }) => ({
    arrayPath,
    regex: new RegExp(path.replace(':index', '(\\d+)$')),
  }));
};

/**
 * Produces a test config using the manifest, form config, and default values
 * to automatically fill in certain settings.
 *
 * @param {Object} config - User-defined config for the test.
 * @param {Object} manifest - The app manifest.
 * @param {Object} formConfig - The config used to build the form.
 */
export const createTestConfig = (config, manifest = {}, formConfig = {}) => {
  const { appName, rootUrl } = manifest;
  const arrayPages = createArrayPageObjects(formConfig);
  const setup = () => {};
  const setupPerTest = () => {};

  return {
    appName,
    arrayPages,
    rootUrl,
    setup,
    setupPerTest,
    ...config,
  };
};
