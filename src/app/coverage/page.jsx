import Clip from '../../components/global/Clip';
import PageHead from '../../components/global/PageHead';

const AREAS = ['Makati', 'BGC', 'Taguig', 'Pasay', 'Manila', 'Quezon City', 'Pasig', 'Mandaluyong'];

export default function CoveragePage() {
  return (
    <div className="ga ga-page">
      <PageHead title="Service Coverage">EasyGo Spa currently serves the following areas:</PageHead>
      <section className="ga-wrap ga-page-sec">
        <ul className="ga-coverage">{AREAS.map((area) => <li key={area}>{area}</li>)}</ul>
      </section>
      <section className="ga-band"><Clip name="drone" phone="city-tall" label="Flying toward a lit condo window in Metro Manila at night" /></section>
    </div>
  );
}
