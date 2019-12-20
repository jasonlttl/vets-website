import React from 'react';
import ContactDetailSection from './ContactDetailSection';
import ReasonForAppointmentSection from './ReasonForAppointmentSection';
import PreferredDatesSection from './PreferredDatesSection';
import PreferredProviderSection from './PreferredProviderSection';

export default function CommunityCareSection(props) {
  return (
    <>
      <PreferredDatesSection data={props.data} />
      <hr className="vads-u-margin-y--2" />
      <PreferredProviderSection
        data={props.data}
        vaCityState={props.vaCityState}
      />
      <hr className="vads-u-margin-y--2" />
      <ReasonForAppointmentSection data={props.data} />
      <hr className="vads-u-margin-y--2" />
      <ContactDetailSection data={props.data} />
    </>
  );
}
