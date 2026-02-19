import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface LearningDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    onSave: (note: string) => void;
    onCancel: () => void;
}

export function LearningDialog({ isOpen, onOpenChange, onSave, onCancel }: LearningDialogProps) {
    const [note, setNote] = useState('');

    const handleSave = () => {
        onSave(note);
        setNote(''); // Reset after save
    };

    const handleCancel = () => {
        setNote('');
        onCancel();
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Learning Note</DialogTitle>
                    <DialogDescription>
                        Enter a description for this learning moment. This will be saved in the event log.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="learning-note">What did we learn?</Label>
                        <Textarea
                            id="learning-note"
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            placeholder="e.g., Defense rotation was late..."
                            className="min-h-[100px]"
                            autoFocus
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={handleCancel}>Cancel</Button>
                    <Button onClick={handleSave}>Save Learning</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
