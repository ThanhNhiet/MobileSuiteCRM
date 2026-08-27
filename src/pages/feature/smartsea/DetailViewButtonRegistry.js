import ConfirmInModal from './sgt_invent_in/modal/detailview-btn-confirm_in-modal';
import { detailViewBtnConfirmInProcess } from './sgt_invent_in/process/detailview-btn-confirm_in-process';
import { detailViewBtnPrintProcess as printInProcess } from './sgt_invent_in/process/detailview-btn-print-process';

import ConfirmOutModal from './sgt_invent_out/modal/detailview-btn-confirm_out-modal';
import { detailViewBtnConfirmOutProcess } from './sgt_invent_out/process/detailview-btn-confirm_out-process';
import { detailViewBtnPrintProcess as printOutProcess } from './sgt_invent_out/process/detailview-btn-print-process';

export const detailViewBtnRegistry = {
    "sgt_invent_in": {
        "confirm_in": {
            modal: ConfirmInModal,
            process: detailViewBtnConfirmInProcess,
            icon: "checkmark-circle-outline",
            color: "#10b981" // emerald
        },
        "print_pdf": {
            process: printInProcess,
            icon: "print-outline",
            color: "#3b82f6" // blue
        }
    },
    "sgt_invent_out": {
        "confirm_out": {
            modal: ConfirmOutModal,
            process: detailViewBtnConfirmOutProcess,
            icon: "checkmark-circle-outline",
            color: "#10b981" // emerald
        },
        "print_pdf": {
            process: printOutProcess,
            icon: "print-outline",
            color: "#3b82f6" // blue
        }
    }
};
