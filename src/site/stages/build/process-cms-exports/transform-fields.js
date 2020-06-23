const path = require('path');
const _ = require('lodash');
const chalk = require('chalk');

const {
  getContentModelType,
  getAllImportsFrom,
  readEntity,
} = require('./helpers');
const { fieldTransformers, serialize } = require('./field-transformers');

const transformers = getAllImportsFrom(
  path.resolve(__dirname, 'field-transformers'),
);

const inputSchemas = getAllImportsFrom(path.resolve(__dirname, 'schemas/raw'));

const outputSchemas = getAllImportsFrom(
  path.resolve(__dirname, 'schemas/transformed'),
);

// These will change if we can replace the manual JSON schema creation process
const getInputSchema = entity => inputSchemas[getContentModelType(entity)];
const getOutputSchema = entity => outputSchemas[getContentModelType(entity)];

/**
 * Identify whether the entity property is an entity reference.
 *
 * Assumes that if the first item in the array is an entity reference, they all
 * will be.
 * @param {Object} prop - The entity property to check
 * @returns {boolean} - True if the property is an entity reference
 */
const isEntityReferenceArray = prop =>
  Array.isArray(prop) && prop[0] && prop[0].target_type && prop[0].target_uuid;

function expandEntityReferenceArray({
  entityReferences,
  outputFieldSchema,
  inputKey,
  outputKey,
  contentModelType,
}) {
  let result = entityReferences.map(ref => {
    const childEntity = readEntity(
      path.resolve(
        __dirname,
        '../../../../../.cache/localhost/cms-export-content',
      ),
      ref.target_type,
      ref.target_uuid,
    );

    // Disabling because we can rely on function hoisting here
    // eslint-disable-next-line no-use-before-define
    return transformFields(childEntity, outputFieldSchema);
  });

  if (result.length > 1 && outputFieldSchema.type !== 'array') {
    // eslint-disable-next-line no-console
    console.error(
      chalk.red(
        `Multiple entity references found at ${inputKey} on ${contentModelType}, but the output schema for ${outputKey} expects a single object.`,
      ),
    );
  } else if (outputFieldSchema.type === 'object') {
    result = result[0];
  }
  return result;
}

/**
 * @param {Object} entity - The raw entity
 * @param {Object} [outputSchemaFromParent] - The schema defining what the
 *                 output should look like. If undefined, this will use the
 *                 transformed schema for the content model type. This is meant
 *                 to be passed for a child entity from the parent's schema,
 *                 specifying only the fields the parent needs.
 */
function transformFields(entity, outputSchemaFromParent) {
  // console.log(JSON.stringify(entity, null, 2));
  // throw new Error('stopping');

  const inputSchema = getInputSchema(entity);
  if (!inputSchema) {
    throw new Error(
      `Could not find input schema for ${getContentModelType(entity)}`,
    );
  }

  const outputSchema = outputSchemaFromParent || getOutputSchema(entity);
  if (!outputSchema) {
    // eslint-disable-next-line no-console
    console.log(`No output schema found for ${getContentModelType(entity)}`);
    return entity;
  }

  // Iterate over each field:
  return Object.entries(outputSchema.properties).reduce(
    /* eslint-disable no-param-reassign */
    /* eslint-disable no-console */
    (result, [outputKey, outputFieldSchema]) => {
      // Find the snake_case key for use in the input schema and entity data
      const inputKey = _.snakeCase(outputKey);

      // Sometimes the output specifies fields added by the transformer.
      // This is for entityType, contentModelType, entityBundle, etc.
      if (!inputSchema.properties[inputKey]) {
        console.log(
          chalk.gray(
            `No schema found for ${inputKey} on ${getContentModelType(
              entity,
            )}. Skipping.`,
          ),
        );
        return result;
      }

      // If the input schema is an entity reference, find the entity reference data and recurse
      if (isEntityReferenceArray(entity[inputKey])) {
        // eslint-disable-next-line no-console
        console.log(
          chalk.gray(`Expanding ${outputKey} (${getContentModelType(entity)})`),
        );
        result[outputKey] = expandEntityReferenceArray({
          entityReferences: entity[inputKey],
          outputFieldSchema,
          inputKey,
          outputKey,
          contentModelType: getContentModelType(entity),
        });
        return result;
      } else {
        console.log(chalk.gray(`${inputKey} is not an entity reference array`));
      }

      // TODO: If the content model has a transformer hook for that field, use it

      // Find the input schema transformers
      const transformField = fieldTransformers.getTransformer(
        inputSchema.properties[inputKey],
        outputSchema.properties[outputKey],
      );

      if (!transformField) {
        result[outputKey] = entity[inputKey];
        return result;
      }

      // Return the transformed field
      result[outputKey] = transformField(entity[inputKey]);
      return result;
    },
    {},
    /* eslint-enable no-console */
    /* eslint-enable no-param-reassign */
  );
}

module.exports = { serialize, transformFields };
