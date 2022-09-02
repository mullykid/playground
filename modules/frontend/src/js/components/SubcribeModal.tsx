import * as React from 'react';
import { Button, TextField, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material';

export interface IModalProps{
    open: boolean
    onClose: any
}

export const SubscribeDialog = (props: IModalProps) => {
 /* const [open, setOpen] = React.useState(false);

  const handleOpen = () => {
    setOpen(props.setOpen);
  };

  const handleClose = () => {
    setOpen(false);
  };*/

  //React.useEffect(() => handleOpen(), [props.setOpen])

  return (
    <div>
      <Dialog open={props.open} onClose={props.onClose}>
        <DialogTitle>Subscribe</DialogTitle>
        <DialogContent>
          <DialogContentText>
            To subscribe to this website, please enter your email address here. We
            will send updates occasionally.
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            id="name"
            label="Email Address"
            type="email"
            fullWidth
            variant="standard"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={props.onClose}>Cancel</Button>
          <Button onClick={props.onClose}>Subscribe</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}