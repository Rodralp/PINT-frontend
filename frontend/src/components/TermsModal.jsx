import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import '../css/LoginAccount.css';

function TermsModal({ isOpen, onClose }) {
  const { i18n } = useTranslation();

  const language = (i18n.language || 'pt').startsWith('en')
    ? 'en'
    : (i18n.language || 'pt').startsWith('es')
      ? 'es'
      : 'pt';

  const termsContent = {
    pt: {
      title: 'Termos de Servico',
      sections: [
        { title: '1. Aceitacao dos termos', body: 'Ao aceder ou utilizar a plataforma, o utilizador declara ter lido, compreendido e aceitado estes Termos na integra.' },
        { title: '2. Utilizadores abrangidos', body: 'A plataforma destina-se exclusivamente a colaboradores da Softinsa, Talent Managers e Service Line Leaders.' },
        { title: '3. Criacao de conta e seguranca', body: 'O utilizador compromete-se a fornecer informacoes verdadeiras e a manter a password confidencial e intransmissivel.' },
        { title: '4. Submissao de evidencias', body: 'As evidencias submetidas devem ser autenticas. A Softinsa pode solicitar documentos adicionais ou rejeitar evidencias insuficientes.' },
        { title: '5. Validacao e aprovacao', body: 'As candidaturas sao analisadas por Talent Managers e Service Line Leaders, com notificacao de aprovacao, rejeicao ou correcao.' },
        { title: '6. Obtencao e utilizacao de badges', body: 'Os badges sao atribuidos quando todos os requisitos sao cumpridos e nao podem ser adulterados, falsificados ou utilizados indevidamente.' },
        { title: '7. Publicacao e partilha', body: 'O utilizador pode autorizar a exibicao de badges na galeria publica e partilhar badges em redes profissionais.' },
        { title: '8. Pontuacao e gamificacao', body: 'A Softinsa pode atribuir pontuacao aos badges para apoiar reconhecimento e evolucao profissional.' },
        { title: '9. Notificacoes', body: 'Ao aceitar estes Termos, o utilizador consente receber notificacoes sobre candidaturas, aprovacoes, rejeicoes, expiracoes e lembretes.' },
        { title: '10. Conduta proibida', body: 'E proibido partilhar credenciais, submeter evidencias falsas, aceder a dados de terceiros sem permissao ou usar a plataforma para fins nao autorizados.' },
        { title: '11. Suspensao ou cancelamento', body: 'A Softinsa pode suspender ou cancelar contas em caso de violacao destes Termos ou utilizacao indevida da plataforma.' },
        { title: '12. Alteracoes aos termos', body: 'Estes Termos podem ser atualizados periodicamente e as alteracoes serao comunicadas aos utilizadores.' },
        { title: '13. Legislacao aplicavel', body: 'Estes Termos regem-se pela legislacao portuguesa e eventuais litigios serao submetidos aos tribunais competentes.' }
      ]
    },
    en: {
      title: 'Terms of Service',
      sections: [
        { title: '1. Acceptance of terms', body: 'By accessing or using the platform, the user confirms they have read, understood, and accepted these Terms in full.' },
        { title: '2. Eligible users', body: 'The platform is intended exclusively for Softinsa employees, Talent Managers, and Service Line Leaders.' },
        { title: '3. Account creation and security', body: 'Users must provide accurate information and keep their password confidential and non-transferable.' },
        { title: '4. Evidence submission', body: 'Submitted evidence must be authentic. Softinsa may request additional documentation or reject insufficient evidence.' },
        { title: '5. Validation and approval', body: 'Applications are reviewed by Talent Managers and Service Line Leaders, with notification of approval, rejection, or correction requests.' },
        { title: '6. Badge awarding and use', body: 'Badges are awarded once all requirements are met and must not be altered, forged, or misused.' },
        { title: '7. Publication and sharing', body: 'Users may authorize badge display on the public gallery and share badges on professional networks.' },
        { title: '8. Scoring and gamification', body: 'Softinsa may assign points to badges to support recognition and professional growth.' },
        { title: '9. Notifications', body: 'By accepting these Terms, users consent to receiving notifications about applications, approvals, rejections, expirations, and reminders.' },
        { title: '10. Prohibited conduct', body: 'Sharing credentials, submitting false evidence, accessing third-party data without permission, or unauthorized use is prohibited.' },
        { title: '11. Suspension or cancellation', body: 'Softinsa may suspend or cancel accounts for Terms violations or improper use of the platform.' },
        { title: '12. Changes to terms', body: 'These Terms may be updated periodically and users will be informed of relevant changes.' },
        { title: '13. Governing law', body: 'These Terms are governed by Portuguese law, and any disputes will be handled by the competent courts.' }
      ]
    },
    es: {
      title: 'Terminos de Servicio',
      sections: [
        { title: '1. Aceptacion de los terminos', body: 'Al acceder o utilizar la plataforma, el usuario declara que ha leido, comprendido y aceptado estos Terminos en su totalidad.' },
        { title: '2. Usuarios incluidos', body: 'La plataforma esta destinada exclusivamente a empleados de Softinsa, Talent Managers y Service Line Leaders.' },
        { title: '3. Creacion de cuenta y seguridad', body: 'El usuario debe proporcionar informacion veraz y mantener la contrasena confidencial e intransferible.' },
        { title: '4. Envio de evidencias', body: 'Las evidencias enviadas deben ser autenticas. Softinsa puede solicitar documentacion adicional o rechazar evidencias insuficientes.' },
        { title: '5. Validacion y aprobacion', body: 'Las candidaturas son evaluadas por Talent Managers y Service Line Leaders, con notificacion de aprobacion, rechazo o correccion.' },
        { title: '6. Obtencion y uso de badges', body: 'Los badges se otorgan cuando se cumplen todos los requisitos y no deben ser alterados, falsificados ni usados indebidamente.' },
        { title: '7. Publicacion y comparticion', body: 'El usuario puede autorizar la publicacion de badges en la galeria publica y compartirlos en redes profesionales.' },
        { title: '8. Puntuacion y gamificacion', body: 'Softinsa puede asignar puntos a los badges para apoyar el reconocimiento y la evolucion profesional.' },
        { title: '9. Notificaciones', body: 'Al aceptar estos Terminos, el usuario consiente recibir notificaciones sobre candidaturas, aprobaciones, rechazos, expiraciones y recordatorios.' },
        { title: '10. Conducta prohibida', body: 'Esta prohibido compartir credenciales, enviar evidencias falsas, acceder a datos de terceros sin permiso o usar la plataforma sin autorizacion.' },
        { title: '11. Suspension o cancelacion', body: 'Softinsa puede suspender o cancelar cuentas por incumplimiento de estos Terminos o uso indebido de la plataforma.' },
        { title: '12. Cambios en los terminos', body: 'Estos Terminos pueden actualizarse periodicamente y los usuarios seran informados de los cambios relevantes.' },
        { title: '13. Legislacion aplicable', body: 'Estos Terminos se rigen por la legislacion portuguesa y cualquier conflicto sera tratado por los tribunales competentes.' }
      ]
    }
  };

  const currentContent = termsContent[language] || termsContent.pt;

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
              <p>{section.body}</p>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}

export default TermsModal;
