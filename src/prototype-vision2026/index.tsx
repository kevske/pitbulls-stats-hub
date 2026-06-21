// PROTOTYPE Vision 2026 v2 — Wegwerf-Code, löschen nach Design-Entscheid.
// Plan: Vier strukturell verschiedene Varianten des neuen Designs in
// Vereinsfarben (Blau #1E4395 / Orange #E87722) auf der bestehenden /-Route,
// umschaltbar via ?variant=A|B|CD|CL. Nur im Dev-Build sichtbar.
import VariantA from './VariantA';
import VariantB from './VariantB';
import VariantC from './VariantC';
import VariantCLight from './VariantCLight';
import PrototypeSwitcher from './PrototypeSwitcher';
import { ProtoData } from './types';

export const PROTO_VARIANTS = [
    { key: 'A',  name: 'Bento Arena' },
    { key: 'B',  name: 'Gameday Broadcast' },
    { key: 'CD', name: 'Editorial Dark' },
    { key: 'CL', name: 'Editorial Light' },
];

const Vision2026Prototype = ({ variant, data }: { variant: string; data: ProtoData }) => {
    const key = PROTO_VARIANTS.some(v => v.key === variant) ? variant : 'A';

    return (
        <>
            {key === 'A'  && <VariantA data={data} />}
            {key === 'B'  && <VariantB data={data} />}
            {key === 'CD' && <VariantC data={data} />}
            {key === 'CL' && <VariantCLight data={data} />}
            <PrototypeSwitcher variants={PROTO_VARIANTS} current={key} />
        </>
    );
};

export default Vision2026Prototype;
