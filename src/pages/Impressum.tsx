import React from 'react';
import Layout from '@/components/Layout';

const Impressum = () => {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-3xl font-bold mb-8 text-foreground">Impressum</h1>
        
        <div className="space-y-8 text-foreground">
          <section>
            <h2 className="text-xl font-semibold mb-4">Angaben gemäß § 5 TMG</h2>
            <div className="space-y-4 text-foreground/80">
              <p>
                <strong>TSV Neuenstadt Basketball</strong><br />
                TSV Neuenstadt e.V.<br />
                Basketball-Abteilung<br />
                <br />
                <strong>Anschrift:</strong><br />
                TSV Neuenstadt e.V.<br />
                Basketball-Abteilung<br />
                [Straße und Hausnummer]<br />
                72631 Neuenstadt<br />
                Deutschland
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">Vertreten durch</h2>
            <div className="space-y-4 text-foreground/80">
              <p>
                <strong>Vorstand:</strong><br />
                [Name des Vorstandsmitglieds]<br />
                [Position im Vorstand]<br />
                <br />
                <strong>Kontakt:</strong><br />
                E-Mail: [E-Mail-Adresse]<br />
                Telefon: [Telefonnummer]
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">Kontakt</h2>
            <div className="space-y-4 text-foreground/80">
              <p>
                <strong>E-Mail:</strong><br />
                [E-Mail-Adresse]<br />
                <br />
                <strong>Website:</strong><br />
                [Website-URL]
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">Haftungsausschluss</h2>
            <div className="space-y-4 text-foreground/80">
              <p>
                <strong>Haftung für Inhalte:</strong><br />
                Die Inhalte dieser Website wurden mit größtmöglicher Sorgfalt erstellt und nach bestem Gewissen recherchiert. 
                Für die Richtigkeit, Vollständigkeit und Aktualität der Inhalte kann jedoch keine Gewähr übernommen werden. 
                Als Diensteanbieter sind wir gemäß § 7 Abs.1 TMG für eigene Inhalte auf diesen Seiten nach den allgemeinen Gesetzen verantwortlich. 
                Nach §§ 8 bis 10 TMG sind wir als Diensteanbieter jedoch nicht verpflichtet, übermittelte oder gespeicherte fremde Informationen zu überwachen 
                oder nach Umständen zu forschen, die auf eine Rechtsverletzung hindeuten. Verpflichtungen zur Entfernung oder Sperrung von Informationen 
                nach den allgemeinen Gesetzen bleiben davon unberührt.
              </p>
              <p>
                <strong>Haftung für Links:</strong><br />
                Unser Angebot enthält Links zu externen Webseiten Dritter, auf deren Inhalte wir keinen Einfluss haben. 
                Deshalb können wir für diese fremden Inhalte auch keine Gewähr übernehmen. 
                Für die Inhalte der verlinkten Seiten ist stets der jeweilige Anbieter oder Betreiber der Seiten verantwortlich. 
                Die verlinkten Seiten wurden zum Zeitpunkt der Verlinkung auf mögliche Rechtsverstöße überprüft. 
                Rechtswidrige Inhalte waren zum Zeitpunkt der Verlinkung nicht erkennbar.
              </p>
              <p>
                <strong>Urheberrecht:</strong><br />
                Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten unterliegen dem deutschen Urheberrecht. 
                Die Vervielfältigung, Bearbeitung, Verbreitung und jede Art der Verwertung außerhalb der Grenzen des Urheberrechtes 
                bedürfen der schriftlichen Zustimmung des jeweiligen Autors bzw. Erstellers. Downloads und Kopien dieser Seite sind nur für den privaten, 
                nicht kommerziellen Gebrauch gestattet. Soweit die Inhalte auf dieser Seite nicht vom Betreiber erstellt wurden, 
                werden die Urheberrechte Dritter beachtet. Insbesondere werden Inhalte Dritter als solche gekennzeichnet. 
                Sollten Sie trotzdem auf eine Urheberrechtsverletzung aufmerksam werden, 
                bitten wir um einen entsprechenden Hinweis. Bei Bekanntwerden von Rechtsverletzungen werden wir derartige Inhalte umgehend entfernen.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">Online-Streitbeilegung</h2>
            <div className="space-y-4 text-foreground/80">
              <p>
                Die EU-Kommission hat eine Online-Plattform zur außergerichtlichen Beilegung von Streitigkeiten 
                geschaffen („OS-Plattform“). Die OS-Plattform dient als Anlaufstelle für die außergerichtliche Beilegung von 
                Streitigkeiten betreffend vertragliche Verpflichtungen, die aus Online-Kaufverträgen erwachsen können. 
                Wir sind nicht verpflichtet und nicht bereit, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.
              </p>
              <p>
                <strong>Verbraucher-Kontaktstelle:</strong><br />
                E-Mail: [E-Mail-Adresse]<br />
                Wir sind nicht bereit, an einem freiwilligen Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.
              </p>
            </div>
          </section>
        </div>
      </div>
    </Layout>
  );
};

export default Impressum;
