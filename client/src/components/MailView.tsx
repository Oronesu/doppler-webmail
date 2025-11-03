
const MailView = ({ body }: { body: string }) => {
  return (
    <div className="p-3 border-start">
      <div dangerouslySetInnerHTML={{ __html: body }} />
    </div>
  );
};


export default MailView;

