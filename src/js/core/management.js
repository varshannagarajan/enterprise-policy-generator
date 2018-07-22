'use strict';

/* global DOWNLOAD_PERMISSION, output, serializer */

const elConfigurationTable = document.getElementById('list-configurations-table');
const elListConfigurationsLink = document.getElementById('list-configurations');
const elNoSavedConfigurations = document.getElementById('no-saved-configurations');
const elSaveConfigurationLink = document.getElementById('save-configuration');

/**
 * @exports management
 */
const management = {
  /**
   * The init() method. Defines the event listeners for the configuration management links.
   *
   * @returns {void}
   */
  init () {
    elListConfigurationsLink.onclick = (e) => {
      e.preventDefault();
      management.showListConfigurationsDialog();
    };

    elSaveConfigurationLink.onclick = (e) => {
      e.preventDefault();
      management.showSaveConfigurationDialog();
    };
  },

  /**
   * Show the "save configuration" dialog. This method also defines the behaviour of the dialog.
   *
   * @returns {void}
   */
  showSaveConfigurationDialog () {
    // show dialog
    const elModal = document.getElementById('modal-save-dialog');
    elModal.classList.add('visible');

    const elName = elModal.querySelector('#save-dialog-name');
    const elSubmitButton = elModal.querySelector('#button-save-dialog-ok');
    const elCloseButton = elModal.querySelector('#button-save-dialog-cancel');

    // focus the name input field
    elName.focus();

    // the name field must not be empty
    elName.oninput = () => {
      if (elName.value) {
        elSubmitButton.removeAttribute('disabled');
      }
      else {
        elSubmitButton.setAttribute('disabled', true);
      }
    };

    // close dialog by clicking the cancel button
    elCloseButton.onclick = () => {
      management.closeSaveConfigurationDialog(elModal, elSubmitButton);
    };

    // save configuration by pressing Enter, close dialog by pressing ESC
    window.onkeydown = (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();

        management.saveConfiguration(elName.value);
        management.closeSaveConfigurationDialog(elModal, elSubmitButton);
      }

      if (e.key === 'Escape') {
        management.closeSaveConfigurationDialog(elModal, elSubmitButton);
      }
    };

    // submit button
    elSubmitButton.onclick = (e) => {
      e.preventDefault();

      management.saveConfiguration(elName.value);
      management.closeSaveConfigurationDialog(elModal, elSubmitButton);
    };
  },

  /**
   * Close the "save configuration" dialog.
   *
   * @param {HTMLElement} elModal - the DOM element of the modal dialog
   * @param {HTMLElement} elSubmitButton - the DOM element of the submit button
   *
   * @returns {void}
   */
  closeSaveConfigurationDialog (elModal, elSubmitButton) {
    elModal.classList.remove('visible');
    elModal.querySelector('#save-dialog-name').value = '';
    elSubmitButton.setAttribute('disabled', true);
  },

  /**
   * Saves the current configuration with a name and the current date and time.
   *
   * @param {string} name - the name of the configuration
   *
   * @returns {void}
   */
  async saveConfiguration (name) {
    const { configurations } = await browser.storage.local.get({ configurations : [] });

    const configuration = {
      name : name,
      time : new Date(),
      configuration : serializer.serialize()
    };

    configurations.push(configuration);

    browser.storage.local.set({ configurations : configurations });
  },

  /**
   * Show the "list configurations" dialog. This method also defines the behaviour of the dialog.
   *
   * @returns {void}
   */
  showListConfigurationsDialog () {
    // show dialog
    const elModal = document.getElementById('modal-list-dialog');
    elModal.classList.add('visible');

    // close dialog by clicking the cancel button
    const elCloseButton = elModal.querySelector('#button-list-dialog-cancel');
    elCloseButton.onclick = () => {
      management.closeListConfigurationsDialog(elModal);
    };

    // close dialog by pressing ESC
    window.onkeydown = (e) => {
      if (e.key === 'Escape') {
        management.closeListConfigurationsDialog(elModal);
      }
    };

    management.listConfigurations(elModal);
  },

  /**
   * Close the "list configurations" dialog.
   *
   * @param {HTMLElement} elModal - the DOM element of the modal dialog
   *
   * @returns {void}
   */
  closeListConfigurationsDialog (elModal) {
    elModal.classList.remove('visible');
  },

  /**
   * List the saved configurations.
   *
   * @returns {void}
   */
  async listConfigurations () {
    management.testDownloadPermission();

    const { configurations } = await browser.storage.local.get({ configurations : [] });
    const configurationLength = configurations.length;

    // show notice if no configurations are saved, otherwise show the configurations table
    if (configurationLength === 0) {
      elNoSavedConfigurations.classList.remove('hidden');
      elConfigurationTable.classList.add('hidden');
    }
    else {
      elNoSavedConfigurations.classList.add('hidden');
      elConfigurationTable.classList.remove('hidden');
    }

    // tbody element, configuration rows will be added here
    const elTableBody = elConfigurationTable.querySelector('tbody');

    // remove old content
    while (elTableBody.firstChild) {
      elTableBody.removeChild(elTableBody.firstChild);
    }

    // add configurations to table
    for (let i = 0; i < configurationLength; i++) {
      // row
      const elRow = document.createElement('tr');
      elTableBody.appendChild(elRow);

      // name column
      const elNameColumn = document.createElement('td');
      elNameColumn.textContent = configurations[i].name;
      elRow.appendChild(elNameColumn);

      // time column
      const elTimeColumn = document.createElement('td');
      elTimeColumn.textContent = configurations[i].time.toLocaleString();
      elRow.appendChild(elTimeColumn);

      // icon column
      const elIconColumn = document.createElement('td');
      elRow.appendChild(elIconColumn);

      // remove icon
      const elRemoveLink = document.createElement('a');
      elRemoveLink.setAttribute('href', '#');
      elRemoveLink.setAttribute('title', browser.i18n.getMessage('title_remove_configuration'));
      elRemoveLink.setAttribute('data-idx', i);
      elRemoveLink.classList.add('icon', 'trash-icon');
      elRemoveLink.addEventListener('click', management.removeConfiguration);
      elIconColumn.appendChild(elRemoveLink);

      const elRemoveIcon = document.createElement('img');
      elRemoveIcon.src = '/images/trash.svg';
      elRemoveIcon.setAttribute('alt', browser.i18n.getMessage('title_remove_configuration'));
      elRemoveLink.appendChild(elRemoveIcon);

      // fake export icon (permission not yet granted)
      const elFakeExportLink = document.createElement('a');
      elFakeExportLink.setAttribute('id', 'fake-export-link');
      elFakeExportLink.setAttribute('href', '#');
      elFakeExportLink.setAttribute('title', browser.i18n.getMessage('configuration_export'));
      elFakeExportLink.setAttribute('data-idx', i);
      elFakeExportLink.classList.add('icon');
      elFakeExportLink.addEventListener('click', management.grantDownloadPermission);
      elIconColumn.appendChild(elFakeExportLink);

      const elFakeExportIcon = document.createElement('img');
      elFakeExportIcon.src = '/images/export.svg';
      elFakeExportIcon.setAttribute('alt', browser.i18n.getMessage('configuration_export'));
      elFakeExportLink.appendChild(elFakeExportIcon);

      // export icon
      const elExportLink = document.createElement('a');
      elExportLink.setAttribute('id', 'export-link');
      elExportLink.setAttribute('href', '#');
      elExportLink.setAttribute('title', browser.i18n.getMessage('configuration_export'));
      elExportLink.setAttribute('data-idx', i);
      elExportLink.classList.add('icon', 'hidden');
      elExportLink.addEventListener('click', management.exportConfiguration);
      elIconColumn.appendChild(elExportLink);

      const elExportIcon = document.createElement('img');
      elExportIcon.src = '/images/export.svg';
      elExportIcon.setAttribute('alt', browser.i18n.getMessage('configuration_export'));
      elExportLink.appendChild(elExportIcon);

      // load icon
      const elLoadLink = document.createElement('a');
      elLoadLink.setAttribute('href', '#');
      elLoadLink.setAttribute('title', browser.i18n.getMessage('title_apply_configuration'));
      elLoadLink.setAttribute('data-idx', i);
      elLoadLink.classList.add('icon');
      elLoadLink.addEventListener('click', management.applyConfiguration);
      elIconColumn.appendChild(elLoadLink);

      const elLoadIcon = document.createElement('img');
      elLoadIcon.src = '/images/check-square.svg';
      elLoadIcon.setAttribute('alt', browser.i18n.getMessage('title_apply_configuration'));
      elLoadLink.appendChild(elLoadIcon);
    }
  },

  /**
   * Applies the selected configuration.
   *
   * @param {MouseEvent} e - event
   *
   * @returns {void}
   */
  async applyConfiguration (e) {
    e.preventDefault();

    const { configurations } = await browser.storage.local.get({ configurations : [] });
    serializer.unserialize(configurations[e.target.parentNode.getAttribute('data-idx')].configuration);
    management.closeListConfigurationsDialog(document.getElementById('modal-list-dialog'));
    document.getElementById('policy-output').innerText = output.generatePoliciesOutput();
    document.getElementById('action-links').classList.remove('hidden');
  },

  /**
   * Removes the selected configuration.
   *
   * @param {MouseEvent} e - event
   *
   * @returns {void}
   */
  async removeConfiguration (e) {
    e.preventDefault();

    const { configurations } = await browser.storage.local.get({ configurations : [] });
    configurations.splice(e.target.parentNode.getAttribute('data-idx'), 1);
    browser.storage.local.set({ configurations : configurations });
    management.listConfigurations();
  },

  /**
   * Tests if the downloads permission has been granted or not. If granted, the link for granting the permission
   * will be hidden and the real export link will be shown.
   *
   * @returns {void}
   */
  async testDownloadPermission () {
    const granted = await browser.permissions.contains(DOWNLOAD_PERMISSION);

    // if the downloads permission is granted hide the link for granting permission and show the
    // real export link instead
    if (granted) {
      document.getElementById('fake-export-link').classList.add('hidden');
      document.getElementById('export-link').classList.remove('hidden');
    }
  },

  /**
   * Grants the download permission and exports the configuration once granted.
   *
   * @param {MouseEvent} e - event
   *
   * @returns {void}
   */
  async grantDownloadPermission (e) {
    e.preventDefault();

    const granted = await browser.permissions.request(DOWNLOAD_PERMISSION);

    // immediately prompt for download after the downloads permission has been granted
    if (granted) {
      management.exportConfiguration(e);
    }
  },

  /**
   * Removes the selected configuration.
   *
   * @param {MouseEvent} e - event
   *
   * @returns {void}
   */
  async exportConfiguration (e) {
    e.preventDefault();

    const { configurations } = await browser.storage.local.get({ configurations : [] });
    const configuration = configurations[e.target.parentNode.getAttribute('data-idx')];
    const serializedConfig = window.btoa(JSON.stringify(configurations[e.target.parentNode.getAttribute('data-idx')]));

    browser.downloads.download({
      saveAs : true,
      url : URL.createObjectURL(new Blob([serializedConfig])),
      filename : 'policy-export-' + configuration.time.getTime() + '.policy'
    });
  }
};

management.init();
