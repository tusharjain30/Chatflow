import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import CreateContactForm from "./CreateContactForm";

type Props = {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

export default function CreateContactModal({ open, onClose, onSuccess }: Props) {
  const handleSuccess = () => {
    onSuccess();   // refresh table
    onClose();     // close modal
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create Contact</DialogTitle>
        </DialogHeader>

        <CreateContactForm onSuccess={handleSuccess} />
      </DialogContent>
    </Dialog>
  );
}
