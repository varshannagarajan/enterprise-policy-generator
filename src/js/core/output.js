'use strict';

/* global policymanager */

/**
 * @exports output
 */
const output = {
  generatePoliciesOutput () {
    policymanager.init();

    // iterate over all checked policy fields and generate output
    [...document.querySelectorAll('.primary-checkbox')].forEach((el) => {
      if (el.checked) {
        if (el.getAttribute('data-type') === 'array') {
          output.generateOutputForArrays(el);
        }
        else if (el.getAttribute('data-type') === 'boolean') {
          output.generateOutputForBooleans(el);
        }
        else if (el.getAttribute('data-type') === 'enum') {
          output.generateOutputForEnums(el);
        }
        else if (el.getAttribute('data-type') === 'object') {
          output.generateOutputForObjects(el);
        }
        else if (el.getAttribute('data-type') === 'string') {
          output.generateOutputForStrings(el);
        }
      }
    });

    return policymanager.getConfiguration();
  },

  generateOutputForArrays (el) {
    const items = [];

    [...el.parentNode.querySelectorAll(':scope > div')].forEach((el) => {
      if (!output.hasInvalidFields(el)) {
        const item = { };

        // input fields
        [...el.querySelectorAll(':scope input')].forEach((el) => {
          output.addInputValue(el, item);
        });

        // enum fields
        [...el.querySelectorAll(':scope select')].forEach((el) => {
          item[el.name] = output.parseEnumContent(el);
        });

        items.push(item);
      }
    });

    // only add non-empty arrays
    if (items.length > 0) {
      policymanager.add(el.name, items);
    }
  },

  generateOutputForBooleans (el) {
    policymanager.add(el.name, !el.getAttribute('data-inverse'));
  },

  generateOutputForEnums (el) {
    const { name } = el;

    [...el.parentNode.querySelectorAll(':scope > .enum select')].forEach((el) => {
      policymanager.add(name, output.parseEnumContent(el));
    });
  },

  generateOutputForObjects (el) {
    const policy = { };

    // object arrays
    [...el.parentNode.querySelectorAll(':scope > div > .object-array')].forEach((el) => {
      const items = [];

      [...el.querySelectorAll(':scope > div:not(.label)')].forEach((el) => {
        if (!output.hasInvalidFields(el)) {
          const obj = {};

          // input fields
          [...el.querySelectorAll(':scope > .input input')].forEach((arrEl) => {
            output.addInputValue(arrEl, obj);
          });

          // enum fields
          [...el.querySelectorAll(':scope > .enum select')].forEach((el) => {
            obj[el.name] = output.parseEnumContent(el);
          });

          // only add non-empty objects
          if (Object.keys(obj).length > 0) {
            items.push(obj);
          }
        }
      });

      // only add non-empty arrays
      if (items.length > 0) {
        policy[el.getAttribute('data-name')] = items;
      }
    });

    // simple arrays
    [...el.parentNode.querySelectorAll(':scope > div > .array')].forEach((el) => {
      const items = [];

      // input fields
      [...el.querySelectorAll(':scope > .input input')].forEach((arrEl) => {
        if (arrEl.value) {
          items.push(arrEl.value);
        }
      });

      // only add non-empty arrays
      if (items.length > 0) {
        policy[el.getAttribute('data-name')] = items;
      }
    });

    // checkboxes
    [...el.parentNode.querySelectorAll(':scope > div > .checkbox input')].forEach((el) => {
      output.addCheckboxValue(el, policy);
    });

    // enum fields
    [...el.parentNode.querySelectorAll(':scope > div > .enum select')].forEach((el) => {
      policy[el.name] = output.parseEnumContent(el);
    });

    // input fields
    [...el.parentNode.querySelectorAll(':scope > div > .input input')].forEach((el) => {
      output.addInputValue(el, policy);
    });

    // set "Locked" field
    output.addLockedField(el, policy);

    // only add non-empty policies
    if (Object.keys(policy).length > 0) {
      policymanager.add(el.name, policy);
    }
  },

  generateOutputForStrings (el) {
    policymanager.add(el.name, el.parentNode.querySelector('input[type=text]').value);
  },

  hasInvalidFields (el) {
    let hasInvalidFields = false;

    if (el.querySelectorAll(':scope .mandatory-style').length > 0) {
      hasInvalidFields = true;
    }

    return hasInvalidFields;
  },

  parseEnumContent (el) {
    let { value } = el.options[el.selectedIndex];

    // null represents an empty state, there is nothing to do
    if (value === 'null') {
      return void 0;
    }

    // if the value is a number treat it as number
    if (!isNaN(value)) {
      value = parseInt(value);
    }

    // if the value is a boolean treat it as boolean
    if (value === 'true' || value === 'false') {
      value = JSON.parse(value);
    }

    return value;
  },

  addInputValue (el, policy) {
    if (el.value) {
      policy[el.name] = el.value;
    }
  },

  addCheckboxValue (el, policy) {
    if (el.checked) {
      policy[el.name] = true;
    }
  },

  addLockedField (el, policy) {
    const lockable = el.parentNode.querySelector('.lock-checkbox');

    if (lockable && lockable.checked) {
      policy['Locked'] = true;
    }
  }
};
