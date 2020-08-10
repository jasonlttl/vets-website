import React from 'react';
import PropTypes from 'prop-types';
import { OperatingStatus } from '../../../constants';

const LocationOperationStatus = ({ operatingStatus }) => {
  let infoMsg;
  let classNameAlert;
  let iconType;
  if (operatingStatus.code === OperatingStatus.NOTICE) {
    infoMsg = 'Facility notice';
    classNameAlert = 'usa-alert-info';
    iconType = 'circle';
  }
  if (operatingStatus.code === OperatingStatus.LIMITED) {
    infoMsg = 'Limited services and hours';
    classNameAlert = 'usa-alert-warning';
    iconType = 'triangle';
  }
  if (operatingStatus.code === OperatingStatus.CLOSED) {
    infoMsg = 'Facility Closed';
    classNameAlert = 'usa-alert-error';
    iconType = 'circle';
  }
  return (
    <div
      className={`usa-alert ${classNameAlert} background-color-only notice-marg-pad`}
    >
      <i
        className={`fa fa-exclamation-${iconType} vads-u-margin-top--1 icon-base`}
      />
      <div className="usa-alert-body">{infoMsg}</div>
    </div>
  );
};

LocationOperationStatus.propTypes = {
  operatingStatus: PropTypes.object,
};

export default LocationOperationStatus;
