import { LightningElement } from 'lwc';
import deployApexClass from '@salesforce/apex/MetadataDeployment.deployApexClass';
export default class Deployment extends LightningElement {
    handleClick() {

        const sessionId = '0Ak5i0000D8SNM3';
        const apexClassName = 'MyApexClass';
        
        const result = deployApexClass({ sessionId, apexClassName });
        
        result.then(
          (showresult) => {
            console.log('Apex class deployed successfully', showresult);
          },
          (error) => {
            console.log('Error deploying Apex class', error);
          },
        );

}
// the MetadataDeployment apex and MyApexClass is on the same org i want to deploy MyApexClass to the target org and i want that when i open my target org developer console then the MyApexClass will shown there
// should i need to create the same MetadataDeployment in the target org
// but in my target org i can't find MyApexClass
}
// import { LightningElement } from 'lwc';
// import deployApexClass from '@salesforce/apex/MetadataDeployment.deployApexClass';

// export default class Deployment extends LightningElement {
//     sessionId = '0Ak5i0000D8RRR8';
//     apexClassName = 'MyapexClass';
    

//     handleClick() {
//         deployApexClass({ sessionId: this.sessionId, apexClassName: this.apexClassName })
//             .then(result => {
//                 console.log('Apex class deployed successfully', result);
//             })
//             .catch(error => {
//                 console.error('Error deploying Apex class', error);
//             });
//     }
// }