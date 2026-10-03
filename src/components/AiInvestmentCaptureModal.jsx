import AiCaptureDialog from "./AiCaptureDialog";

export default function AiInvestmentCaptureModal(props) {
  return <AiCaptureDialog {...props} targetDomain={"INVESTMENT"}
    title="Capture a holding"
    description="Describe a holding or attach a statement screenshot. Values remain user-entered or estimated."
    placeholder="25 Infosys shares bought at ₹1,540 each. Latest recorded price ₹1,620, valued today."
    label="Holding or purchase details"
    imageLabel="Add a statement or holding screenshot" />;
}
