import { LightningElement, wire } from 'lwc';
import retrieveApexClass from '@salesforce/apex/MetadataDeployment.retrieveApexClass';

export default class MetadataPicklist extends LightningElement {
    metadataTypes = [];
    selectedMetadataTypes = [];

    @wire(retrieveApexClass)
    wiredMetadataTypes({ error, data }) {
        if (data) {
            this.metadataTypes = data.map((item) => {
                return {
                    label: item.label,
                    value: item.value
                };
            });
        } else if (error) {
            // Handle the error if needed
            console.error("error",error);
        }
    }

    handlePicklistChange(event) {
        this.selectedMetadataTypes = event.detail.value;
        // Dispatch an event to notify the selected metadata types to the parent component
        this.dispatchEvent(new CustomEvent('metadatatypeselect', { detail: this.selectedMetadataTypes }));
    }
}