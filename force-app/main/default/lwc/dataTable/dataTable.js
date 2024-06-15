import { ShowToastEvent } from "lightning/platformShowToastEvent";
import { LightningElement, api, track, wire } from "lwc";
import getComparions from "@salesforce/apex/ApexComparision.getComparions";

const columns = [
  { label: "Id", fieldName: "Id", type: "id" },
  { label: "Name", fieldName: "Name" },
  { label: "Source", fieldName: "Source" },
  { label: "Target", fieldName: "Target" },
  { label: "Status", fieldName: "Status" }
];

export default class DataTable extends LightningElement {
  @track availableData = [];
  @api source;
  @api target;
  @track columns = columns;
  @track showsString = false;

  @wire(getComparions, { targetOrg: "$target", sourceOrg: "$source" })
  wiredData({ error, data }) {
    if (data) {
      this.availableData = data;
    } else if (error) {
      console.log(error);
    }
  }

  handleRowClick() {
    this.showsString = true;
  }

  showToastMessage(message) {
    const toastEvent = new ShowToastEvent({
      title: "Info",
      message: message,
      variant: "info"
    });
    this.dispatchEvent(toastEvent);
  }
}