import React from 'react';

export default function SignInDescription() {
  return (
    <div className="usa-width-one-half">
      <div className="explanation-content vads-u-padding-left--2p5">
        <div className="vads-u-display--none medium-screen:vads-u-display--block">
          <h2 className="usa-font-lead vads-u-margin-top--0">
            One sign in. A lifetime of benefits and services at your fingertips.
          </h2>
        </div>
        <ul>
          <li>Check your disability claim and appeal status</li>
          <li>
            Find out how much money you have left to pay for school or training
          </li>
          <li>
            Refill your prescriptions and communicate with your health care team
          </li>
          <li>...and more</li>
        </ul>
        <p>
          Use your existing DS Logon, My HealtheVet, or ID.me account to sign in
          to access and manage your VA benefits and health care.
        </p>
        <h3 className="vads-u-font-size--base vads-u-margin-top--2">
          A secure account powered by ID.me
        </h3>
        <p className="vads-u-margin-top--0">
          ID.me is our trusted technology partner in helping to keep your
          personal information safe. They specialize in digital identity
          protection and help us make sure you're you—and not someone pretending
          to be you—before we give you access to your information.
        </p>
        <p>
          <a href="/sign-in-faq/#what-is-idme" target="_blank">
            Learn more about ID.me
          </a>
        </p>
      </div>
    </div>
  );
}
