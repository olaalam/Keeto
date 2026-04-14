import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

export default function ViewPermissionsModal({ isOpen, onClose, role }) {
    if (!role) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex gap-2 text-xl font-bold">
                        Permissions: <span className="text-red-600">{role.name}</span>
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-6 mt-4 max-h-[60vh] overflow-y-auto pr-2">
                    {role.permissions?.map((permGroup, index) => (
                        <div key={index} className="space-y-3">
                            <div className="flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full bg-red-600"></div>
                                <h4 className="font-semibold text-gray-800 capitalize">
                                    {permGroup.module}:
                                </h4>
                            </div>
                            <div className="flex flex-wrap gap-2 pl-4">
                                {permGroup.actions.map((act, i) => (
                                    <span
                                        key={i}
                                        className="px-4 py-1 text-sm bg-gray-50 border border-gray-200 rounded-full text-gray-600 capitalize"
                                    >
                                        {/* تحويل 'read' إلى 'View' كعرض للمستخدم */}
                                        {act.action === 'read' ? 'View' : act.action}
                                    </span>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </DialogContent>
        </Dialog>
    );
}