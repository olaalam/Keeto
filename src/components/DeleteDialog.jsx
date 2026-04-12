import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useDelete } from "@/hooks/useDelete";

const DeleteDialog = ({
    isOpen,
    onClose,
    apiUrl,
    onSuccessKey,
    id,
    title = "are you sure?"
}) => {
    // استدعاء الـ Hook الذي قمتِ بكتابته
    const deleteMutation = useDelete(apiUrl, onSuccessKey);

    const handleConfirm = () => {
        deleteMutation.mutate(id, {
            onSuccess: () => {
                onClose(); // إغلاق المودال بعد النجاح
            }
        });
    };

    return (
        <AlertDialog open={isOpen} onOpenChange={onClose}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{title}</AlertDialogTitle>
                    <AlertDialogDescription>
                        you can't undo this action. the data will be deleted permanently from the server.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={deleteMutation.isPending}>
                        cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                        onClick={(e) => {
                            e.preventDefault(); // نمنع الإغلاق التلقائي لنتحكم فيه بعد نجاح الـ API
                            handleConfirm();
                        }}
                        className="bg-red-600 hover:bg-red-700"
                        disabled={deleteMutation.isPending}
                    >
                        {deleteMutation.isPending ? "deleting..." : "confirm delete"}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
};

export default DeleteDialog;