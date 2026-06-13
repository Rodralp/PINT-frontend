import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import '../css/LoginAccount.css';

function PrivacyModal({ isOpen, onClose }) {
  const { i18n } = useTranslation();

  const language = (i18n.language || 'pt').startsWith('en')
    ? 'en'
    : (i18n.language || 'pt').startsWith('es')
      ? 'es'
      : 'pt';

  const privacyContent = {
    pt: {
      title: 'Politica de Privacidade',
      sections: [
        { title: '1. Responsavel pelo tratamento dos dados', paragraphs: ['A Softinsa e a entidade responsavel pelo tratamento dos seus dados pessoais no ambito da plataforma.'] },
        {
          title: '2. Que dados recolhemos?',
          paragraphs: ['Ao utilizar a plataforma, podemos recolher as seguintes categorias de dados:'],
          bullets: [
            'Dados profissionais: nome, email corporativo, area e funcao.',
            'Dados de autenticacao e historico de acessos.',
            'Evidencias submetidas para obtencao de badges.',
            'Historico de badges, progresso e pontuacao.',
            'Dados de notificacoes e preferencias de contacto.'
          ]
        },
        {
          title: '3. Como utilizamos os seus dados?',
          bullets: [
            'Gestao de conta e autenticacao.',
            'Submissao, validacao e aprovacao de candidaturas.',
            'Emissao/publicacao de badges digitais.',
            'Notificacoes sobre pedidos e expiracoes.',
            'Relatorios agregados para melhoria da plataforma.'
          ]
        },
        {
          title: '4. Fundamento legal',
          bullets: [
            'Execucao de relacao profissional e formacao.',
            'Consentimento para partilha publica e integracoes.',
            'Interesse legitimo na gestao de talento.',
            'Cumprimento de obrigacoes legais aplicaveis.'
          ]
        },
        {
          title: '5. Com quem partilhamos os seus dados?',
          bullets: [
            'Talent Managers e Service Line Leaders.',
            'Administradores da plataforma.',
            'Fornecedores tecnicos sob obrigacoes contratuais.',
            'Redes profissionais apenas com autorizacao do utilizador.',
            'Autoridades publicas quando exigido por lei.'
          ],
          paragraphs: ['Os dados nao sao vendidos para fins de marketing.']
        },
        {
          title: '6. Pagina publica de badges',
          paragraphs: ['Cada badge aprovado pode ter pagina publica com nome, badge obtido, data e competencias certificadas. O utilizador pode solicitar remocao a qualquer momento.']
        },
        {
          title: '7. Conservacao dos dados',
          paragraphs: ['Os dados sao conservados apenas pelo tempo necessario a cada finalidade e obrigacao legal, sendo depois anonimizados ou eliminados de forma segura.']
        },
        {
          title: '8. Direitos do titular',
          bullets: [
            'Acesso, retificacao e apagamento (quando aplicavel).',
            'Limitacao e oposicao ao tratamento.',
            'Portabilidade dos dados fornecidos.',
            'Retirada de consentimento a qualquer momento.'
          ]
        },
        {
          title: '9. Seguranca dos dados',
          bullets: [
            'Comunicacao segura (HTTPS).',
            'Armazenamento cifrado de passwords.',
            'Controlo de acessos por perfil.',
            'Registos de auditoria de acoes criticas.'
          ]
        },
        {
          title: '10. Dados de menores',
          paragraphs: ['A plataforma destina-se a colaboradores com idade igual ou superior a 18 anos.']
        }
      ]
    },
    en: {
      title: 'Privacy Policy',
      sections: [
        { title: '1. Data controller', paragraphs: ['Softinsa is the entity responsible for processing your personal data within this platform.'] },
        {
          title: '2. What data do we collect?',
          paragraphs: ['When using the platform, we may collect:'],
          bullets: [
            'Professional data: name, corporate email, area and role.',
            'Authentication data and access history.',
            'Evidence submitted for badge applications.',
            'Badge history, progress and scoring.',
            'Notification data and contact preferences.'
          ]
        },
        {
          title: '3. How we use your data',
          bullets: [
            'Account management and authentication.',
            'Submission, validation and approval workflows.',
            'Digital badge issuance/publication.',
            'Notifications about requests and expirations.',
            'Aggregated reporting to improve the platform.'
          ]
        },
        {
          title: '4. Legal basis',
          bullets: [
            'Execution of professional/training relationship.',
            'Consent for public sharing and integrations.',
            'Legitimate interest in talent management.',
            'Compliance with applicable legal obligations.'
          ]
        },
        {
          title: '5. Data sharing',
          bullets: [
            'Talent Managers and Service Line Leaders.',
            'Platform administrators.',
            'Technical providers under contractual obligations.',
            'Professional networks only with user authorization.',
            'Public authorities when legally required.'
          ],
          paragraphs: ['Data is not sold for marketing purposes.']
        },
        {
          title: '6. Public badge page',
          paragraphs: ['Approved badges may have a public page showing name, badge, issue date and certified skills. Users may request removal at any time.']
        },
        {
          title: '7. Data retention',
          paragraphs: ['Data is retained only for the period necessary for each purpose and legal obligation, then anonymized or securely deleted.']
        },
        {
          title: '8. Data subject rights',
          bullets: [
            'Access, rectification and erasure (where applicable).',
            'Restriction and objection to processing.',
            'Portability of provided data.',
            'Withdrawal of consent at any time.'
          ]
        },
        {
          title: '9. Data security',
          bullets: [
            'Secure communication (HTTPS).',
            'Encrypted password storage.',
            'Role-based access control.',
            'Audit logs for critical actions.'
          ]
        },
        {
          title: '10. Minors data',
          paragraphs: ['The platform is intended for collaborators aged 18 and over.']
        }
      ]
    },
    es: {
      title: 'Politica de Privacidad',
      sections: [
        { title: '1. Responsable del tratamiento', paragraphs: ['Softinsa es la entidad responsable del tratamiento de sus datos personales en esta plataforma.'] },
        {
          title: '2. Que datos recogemos?',
          paragraphs: ['Al utilizar la plataforma, podemos recoger:'],
          bullets: [
            'Datos profesionales: nombre, email corporativo, area y funcion.',
            'Datos de autenticacion e historial de accesos.',
            'Evidencias enviadas para candidaturas de badges.',
            'Historial de badges, progreso y puntuacion.',
            'Datos de notificaciones y preferencias de contacto.'
          ]
        },
        {
          title: '3. Como utilizamos sus datos',
          bullets: [
            'Gestion de cuenta y autenticacion.',
            'Envio, validacion y aprobacion de candidaturas.',
            'Emision/publicacion de badges digitales.',
            'Notificaciones sobre solicitudes y expiraciones.',
            'Informes agregados para mejorar la plataforma.'
          ]
        },
        {
          title: '4. Base legal',
          bullets: [
            'Ejecucion de relacion profesional/formativa.',
            'Consentimiento para compartir publicamente e integraciones.',
            'Interes legitimo en gestion del talento.',
            'Cumplimiento de obligaciones legales aplicables.'
          ]
        },
        {
          title: '5. Con quien compartimos los datos?',
          bullets: [
            'Talent Managers y Service Line Leaders.',
            'Administradores de la plataforma.',
            'Proveedores tecnicos con obligaciones contractuales.',
            'Redes profesionales solo con autorizacion del usuario.',
            'Autoridades publicas cuando sea legalmente exigido.'
          ],
          paragraphs: ['Los datos no se venden con fines de marketing.']
        },
        {
          title: '6. Pagina publica de badges',
          paragraphs: ['Los badges aprobados pueden tener una pagina publica con nombre, badge, fecha de emision y competencias certificadas. El usuario puede solicitar su eliminacion.']
        },
        {
          title: '7. Conservacion de datos',
          paragraphs: ['Los datos se conservan solo durante el tiempo necesario para cada finalidad y obligacion legal, y despues se anonimizan o eliminan de forma segura.']
        },
        {
          title: '8. Derechos del titular',
          bullets: [
            'Acceso, rectificacion y supresion (cuando proceda).',
            'Limitacion y oposicion al tratamiento.',
            'Portabilidad de los datos proporcionados.',
            'Retirada del consentimiento en cualquier momento.'
          ]
        },
        {
          title: '9. Seguridad de los datos',
          bullets: [
            'Comunicacion segura (HTTPS).',
            'Almacenamiento cifrado de contrasenas.',
            'Control de accesos por perfiles.',
            'Registros de auditoria para acciones criticas.'
          ]
        },
        {
          title: '10. Datos de menores',
          paragraphs: ['La plataforma esta destinada a colaboradores de 18 anos o mas.']
        }
      ]
    }
  };

  const currentContent = privacyContent[language] || privacyContent.pt;

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="terms-modal-overlay" onClick={handleBackdropClick}>
      <div className="terms-modal-container">
        <div className="terms-modal-header">
          <h1 className="terms-modal-title">{currentContent.title}</h1>
          <button className="terms-modal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="terms-modal-content">
          {currentContent.sections.map((section) => (
            <section className="terms-section" key={section.title}>
              <h2>{section.title}</h2>
              {section.paragraphs && section.paragraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
              {section.bullets && (
                <ul>
                  {section.bullets.map((bullet) => (
                    <li key={bullet}>{bullet}</li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}

export default PrivacyModal;
