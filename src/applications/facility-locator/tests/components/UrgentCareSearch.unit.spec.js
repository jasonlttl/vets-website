import { expect } from 'chai';
import { shallow } from 'enzyme';
import {
  urgentCareCall,
  posProviderName,
} from '../../components/search-results-items/UrgentCareResult';
import { CLINIC_URGENTCARE_SERVICE, LocationType } from '../../constants';

describe('UrgentCareSearch', () => {
  it('Should not render urgent care call.', () => {
    const urgentCallNotReturn = urgentCareCall({});
    expect(urgentCallNotReturn).to.equal(null);
  });

  it('Should render urgentCareCall in result item - cc_provider, urgent_care_service ', () => {
    const urgentCall = urgentCareCall({
      facilityType: LocationType.CC_PROVIDER,
      serviceType: CLINIC_URGENTCARE_SERVICE,
    });
    const wrapper = shallow(urgentCall);
    expect(wrapper.type()).to.not.equal(null);
    const p = wrapper.find('p');
    expect(p.length).to.equal(1);
    expect(p.text()).to.be.a('string');
    wrapper.unmount();
  });

  it('Should render urgentCareCall in result item - urgent_care, non_va_urgentcare  ', () => {
    const urgentCall = urgentCareCall({
      facilityType: LocationType.URGENT_CARE,
      serviceType: 'NonVAUrgentCare',
    });
    const wrapper = shallow(urgentCall);
    expect(wrapper.type()).to.not.equal(null);
    const p = wrapper.find('p');
    expect(p.length).to.equal(1);
    expect(p.text()).to.be.a('string');
    wrapper.unmount();
  });

  it('Should not render urgent care call with invalid facility/service types', () => {
    const urgentCallInvalid = urgentCareCall({
      facilityType: 'TestInvalid',
      serviceType: 'TestInvalid',
    });
    expect(urgentCallInvalid).to.equal(null);
  });

  it('Should return correct labels for urgent care (UrgentCare, WalkIn)', () => {
    const walkIn = posProviderName(17);
    const urgentCare1 = posProviderName(20);
    expect(walkIn).to.equal('RETAIL/WALK-IN CARE');
    expect(urgentCare1).to.equal('URGENT CARE');
  });
});
