import { LightningElement, wire } from "lwc";
import retrieveApexClass from '@salesforce/apex/MetadataDeployment.retrieveApexClass';
export default class MetadataTypePicklist extends LightningElement {
  metadataTypes = [];
  selectedMetadataType;

  @wire(retrieveApexClass, {
    sourceOrg: "sourceOrgId",
    apexClassName: "ApexClassName"
  })
  wiredMetadataTypes({ error, data }) {
    if (data) {
      this.metadataTypes = data.map((metadataType) => {
        return { label: metadataType, value: metadataType };
      });
      this.selectedMetadataType = data[0]; // Default to the first option
    } else if (error) {
      console.error("Error retrieving metadata types:", error);
    }
  }

  handleChange(event) {
    this.selectedMetadataType = event.detail.value;
  }
}