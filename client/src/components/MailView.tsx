
const MailView = ({ body }: { body: string }) => {
  return (
    <div className="p-3">
      <h5>📨 Contenu du message</h5>
      <div dangerouslySetInnerHTML={{ __html: body }} />
    </div>
  );
};



export default MailView;

