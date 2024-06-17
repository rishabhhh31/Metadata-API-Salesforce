import { LightningElement, wire, track } from "lwc";
import { ShowToastEvent } from "lightning/platformShowToastEvent";
import getAuthorizedRecords from "@salesforce/apex/AuthorizedPicklistValuesController.getAuthorizedRecords";
import getMetadataTypes from "@salesforce/apex/MetadataTypesRetriever.getMetadataTypes";
import getSelectedMetadataItemsForOrgs from "@salesforce/apex/MetadataTypesRetriever.getSelectedMetadataItemsForOrgs";
import deployMetadataItems from "@salesforce/apex/MetadataDeployment.deployMetadataItems";
import checkDeploymentStatus from "@salesforce/apex/MetadataDeployment.checkDeploymentStatus";
import recentDeployment from "@salesforce/apex/MetadataDeployment.recentDeployment";
import getmetadatazips from "@salesforce/apex/MetadataDeployment.getmetadatazips";
import { loadScript } from 'lightning/platformResourceLoader';
import JSZIP from '@salesforce/resourceUrl/JSZip';
import LightningAlert from 'lightning/alert';
const columns = [
	{ label: "Name", fieldName: "fullName" },
	{ label: "Metadata Type", fieldName: "metaDataType" },
	{ label: "Category", fieldName: "category" }
];

export default class AuthMetadataApi extends LightningElement {
	@track TypeofValidation
	@track selectedSource;
	@track selectedTarget;
	@track sourceOptions = [];
	@track targetOptions = [];
	@track selectedRows = [];
	@track metadataitem;
	@track metadataDetails = {
		source: [],
		target: []
	};
	selectedRows = []
	columns = columns;
	filteredMetadataDetails = [];
	isTargetDisabled = true;
	showSourceTarget = false;
	showMetadataTypes = false;
	showDataTable = false;
	selectedSourceitems = '';
	selectedTargetitems = '';
	metadataTypes = [];
	selectedMetadataTypes = [];
	selectedItems = [];
	url;
	errormessage;
	showTextArea = false;
	showCompareCard = false;
	updatethesource;
	loaded = true;
	disableValidate = true;
	disablebuttonmenu = true;
	disablenext1 = true;
	disableDualPicklistNext = true;
	disableDownload = true;
	disableDeploy = true;
	ValidationId = [];
	detailofMetadata = [];
	isSuccess = false;
	isCommonSelected = false;
	showCompareButton = true;
	copiedMetadata = [];
	isModalOpen = false;
	testClassData = [];
	fullNames = [];

	connectedCallback() {
		loadScript(this, JSZIP)
			.then(() => {
			})
			.catch(error => {
				console.error('Error loading JSZip:', error);
			});
	}

	RecordPicklistValues(records) {
		return records.map((record) => {
			return {
				label: record.Name,
				value: record.Id
			};
		});
	}

	@wire(getAuthorizedRecords)
	authorizedRecords({ error, data }) {
		if (data) {
			this.sourceOptions = this.RecordPicklistValues(data);
			this.showSourceTarget = true;
		} else if (error) {
			console.error("Error records:", error);
		}
	}

	handleSourceChange(event) {
		this.selectedSource = event.detail.value;
		this.targetOptions = this.getTargetOptions();
		this.disablenext1 = true;
		this.isTargetDisabled = false;
	}

	handleTargetChange(event) {
		this.selectedTarget = event.detail.value;
		if (this.selectedSource && this.selectedTarget) {
			this.disablenext1 = false;
		} else {
			this.disablenext1 = true;
		}
	}

	getTargetOptions() {
		return this.sourceOptions.filter(
			(option) => option.value !== this.selectedSource
		);
	}

	async orgMetadataTypes() {
		let data = await getMetadataTypes({ sourceOrgId: this.selectedSource, targetOrgId: this.selectedTarget })
		this.metadataTypes = data.map((metadataType) => {
			return {
				label: metadataType.label,
				value: metadataType.value
			};
		});
		this.showSourceTarget = false;
		this.showMetadataTypes = true;
		this.loaded = true;
	}

	handleNext1() {
		this.loaded = false;
		this.orgMetadataTypes();
	}

	handlePrevious() {
		this.showSourceTarget = true;
		this.showMetadataTypes = false;
	}

	async retrieveSelectedMetadata() {
		let result = await getSelectedMetadataItemsForOrgs({ selectedTypes: this.selectedMetadataTypes, isSourceOrg: true, sourceOrgId: this.selectedSource, targetOrgId: this.selectedTarget });
		let count = 0;
		this.metadataDetails.source = result.source.map((item) => {
			count++;
			return {
				...item,
				category: "New",
				Id: Date.now() + count
			};
		});
		this.metadataDetails.target = result.target.map((item) => {
			count++;
			return {
				...item,
				category: "Deleted",
				Id: Date.now() + count
			};
		});
		this.filteredMetadataDetails = [
			...this.metadataDetails.source,
			...this.metadataDetails.target
		];
		this.filteredMetadataDetails = this.filteredMetadataDetails.filter(item => !item.fullName.toLowerCase().includes('test'));
		this.copiedMetadata = [...this.filteredMetadataDetails];

		let commonMetadataItems = this.metadataDetails.source.filter((sourceItem) =>
			this.metadataDetails.target.some(
				(targetItem) => targetItem.fullName === sourceItem.fullName
			)
		);
		this.detailofMetadata = commonMetadataItems;
		if (commonMetadataItems.length > 0) {
		} else {
			this.showToastMessage(
				"No common metadata items for comparison",
				"info"
			);
		}
		this.loaded = true;
		this.showMetadataTypes = false;
		this.showDataTable = true;
	}

	handleNextForDatatable() {
		this.loaded = false;
		this.retrieveSelectedMetadata();
	}

	handleAllItems() {
		this.selectedRows = [];
		this.isCommonSelected = false;
		this.filteredMetadataDetails = [
			...this.metadataDetails.source,
			...this.metadataDetails.target
		];
		this.filteredMetadataDetails = this.filteredMetadataDetails.filter(item => !item.fullName.toLowerCase().includes('test'));
		this.copiedMetadata = [...this.filteredMetadataDetails];
	}

	handleNewItems() {
		this.selectedRows = [];
		this.isCommonSelected = false;
		this.filteredMetadataDetails = this.metadataDetails.source.filter((item) => {
			return (!item.fullName.toLowerCase().includes('test'))
		});
		this.copiedMetadata = [...this.filteredMetadataDetails];
	}

	handleCommonItems() {
		this.selectedRows = [];
		this.isCommonSelected = true;
		this.filteredMetadataDetails = this.detailofMetadata.map((item) => {
			return {
				...item,
				category: 'Common'
			}
		})
		this.copiedMetadata = [...this.filteredMetadataDetails];
	}

	handleDeletedItems() {
		this.selectedRows = [];
		this.isCommonSelected = false;
		this.filteredMetadataDetails = this.metadataDetails.target.filter((item) => {
			return (!item.fullName.toLowerCase().includes('test'))
		}
		);
		this.copiedMetadata = [...this.filteredMetadataDetails];
	}

	handlePreviousDatatable() {
		this.showDataTable = false;
		this.showMetadataTypes = true;
		this.filteredMetadataDetails = [];
	}

	handleMetadataTypesChange(event) {
		this.selectedMetadataTypes = event.detail.value;
		let countSelectedMetadataType = event.detail.value.length;
		this.disableDualPicklistNext = !(countSelectedMetadataType > 0);
	}

	showToastMessage(title, message, variant) {
		const toastEvent = new ShowToastEvent({
			title: title,
			message: message,
			variant: variant
		});
		this.dispatchEvent(toastEvent);
	}

	keepOnlyLastObject(jsonArray) {
		if (jsonArray.length > 0 && this.selectedRows.length > 0) {
			const selectedId = this.selectedRows[0];
			return jsonArray.find(item => item.Id !== selectedId);
		} else {
			return jsonArray[0];
		}
	}

	handleCheckboxSelection(event) {
		let countCheckboxSelection = event.detail.selectedRows.length;
		if (countCheckboxSelection > 0 && this.isCommonSelected) {
			let lastSelection = this.keepOnlyLastObject(event.detail.selectedRows)
			this.selectedRows = [lastSelection.Id];
			this.showCompareButton = false;
		} else {
			this.showCompareButton = true;
		}
		this.selectedItems = [...event.detail.selectedRows];
		if (countCheckboxSelection > 0) {
			this.disableValidate = false;
			this.disablebuttonmenu = false;
			this.disableDownload = false;
		} else {
			this.disableValidate = true;
			this.disablebuttonmenu = true;
			this.disableDownload = true;
		}
	}

	handleSearchChange(event) {
		this.filteredMetadataDetails = [...this.copiedMetadata];
		this.loaded = false;
		this.searchKey = event.target.value.toLowerCase();
		let filtered = this.filteredMetadataDetails.filter(item => {
			return item.fullName.toLowerCase().includes(this.searchKey);
		})
		this.filteredMetadataDetails = [...filtered];
		this.loaded = true;
	}

	handleValidateClick() {
		this.loaded = false;
		if (!this.TypeofValidation) {
			this.TypeofValidation = 'NoTestRun';
		}
		if (!this.selectedItems || this.selectedItems.length === 0) {
			this.showToastMessage("No metadata items selected", "warning");
			return;
		}
		const resultMap = new Map();
		this.selectedItems.forEach(item => {
			if (!resultMap.has(item.metaDataType)) {
				resultMap.set(item.metaDataType, new Set());
			}
			resultMap.get(item.metaDataType).add(item.fullName);
		})
		let resultArray = [];
		for (let key of resultMap.keys()) {
			let obj = { type: key, fullName: [...resultMap.get(key)] };
			if (key === 'ApexClass') {
				obj.fullName = [...resultMap.get(key), ...this.fullNames];
			}
			resultArray = [...resultArray, obj];
		}
		deployMetadataItems({
			sourceOrg: this.selectedSource,
			targetOrg: this.selectedTarget,
			metadataItemNames: JSON.stringify(resultArray),
			TypeofValidation: this.TypeofValidation,
			testClassesToRun: this.fullNames
		})
			.then((result) => {
				this.ValidationId = result;
				this.checkDeploy(this.ValidationId);
				this.errorData = result;
			})
			.catch((error) => {
				this.showToastMessage(
					`Validation Error metadata items: ${error.message}`,
					"error"
				);
				this.loaded = true;
			});
	}

	async handleDeployClick() {
		let statusDeploy = await recentDeployment({ targetOrg: this.selectedTarget, valId: this.ValidationId })
		if (statusDeploy) {
			this.showToastMessage("Deployment Completed", "Deployed Successfully 😊", "success");
		}
	}
	async checkDeploy(valId) {
		let isDone = false;
		while (!isDone) {
			let data = await this.delay(valId, 3000);
			let deployResult = JSON.parse(data);
			if (deployResult.status == 'Succeeded' || deployResult.status == 'Failed') {
				if (deployResult.status == 'Succeeded') {
					this.showToastMessage("Done", "Validation Done Successfully", "success");
					this.disableDeploy = false;
				} else {
					this.showToastMessage("Failed", "Validation Failed", "error");
					this.disableDeploy = true;
					this.handleAlertClick();
				}
				isDone = true;
				break;
			}
		}
		this.loaded = true;
	}
	async handleAlertClick() {
		await LightningAlert.open({
			message: this.errormessage,
			theme: 'error',
			label: 'Error!',
		});
	}
	delay(valId, ms) {
		return new Promise(async (resolve, reject) => {
			try {
				let data = await checkDeploymentStatus({ deploymentId: valId, targetOrg: this.selectedTarget });
				data = JSON.parse(data);
				if (data.success === false) {
					let errorData = [];
					if (data.componentFailures && data.componentFailures.length > 0) {
						errorData = errorData.concat(data.componentFailures.map(failure => ({
							id: failure.id,
							fullName: failure.fullName,
							problem: failure.problem,
							lineNumber: failure.lineNumber
						})));
					}

					if (data.details && data.details.componentFailures && data.details.componentFailures.length > 0) {
						errorData = errorData.concat(data.details.componentFailures.map(failure => ({
							id: failure.id,
							fullName: failure.fullName,
							problem: failure.problem,
							lineNumber: failure.lineNumber
						})));
					}

					if (data.details && data.details.runTestResult && data.details.runTestResult.codeCoverageWarnings) {
						errorData = errorData.concat(data.details.runTestResult.codeCoverageWarnings.map(warning => ({
							message: warning.message
						})));
						data.details.runTestResult.codeCoverageWarnings.forEach(warning => {
						});
					}
					let errorMessage = '';
					errorData.forEach(item => {
						if (item.message) {
							errorMessage += `Message: ${item.message}\n\n`;
						} else {
							errorMessage += `Full Name: ${item.fullName || 'N/A'}\n`;
							errorMessage += `Problem: ${item.problem || 'N/A'}\n`;
							errorMessage += `Line Number: ${item.lineNumber || 'N/A'}\n\n`;
						}
					});
					this.errormessage = errorMessage;
					resolve(JSON.stringify(data));

				} else {
					resolve(JSON.stringify(data));
				}
			} catch (error) {
				reject(error);
			}
			setTimeout(() => { resolve() }, ms);
		});
	}

	handleDownload() {
		this.loaded = false;
		if (!this.selectedItems || this.selectedItems.length === 0) {
			this.showToastMessage("No metadata items selected", "warning");
			return;
		}
		let sourceData = this.selectedItems.filter(item => item.category == 'New');
		let targetData = this.selectedItems.filter(item => item.category == 'Deleted');
		let sourceAndTargetData = {};
		if (sourceData.length > 0) {
			sourceAndTargetData.source = sourceData
		}
		if (targetData.length > 0) {
			sourceAndTargetData.target = targetData;
		}
		for (let key of Object.keys(sourceAndTargetData)) {
			let resultMap = new Map();
			sourceAndTargetData[key].forEach(obj => {
				if (!resultMap.has(obj.metaDataType)) {
					resultMap.set(obj.metaDataType, new Set());
				}
				resultMap.get(obj.metaDataType).add(obj.fullName);
			})
			let resultArray = [];
			for (let k of resultMap.keys()) {
				let obj = { type: k, fullName: [...resultMap.get(k)] };
				resultArray = [...resultArray, obj];
			}
			let orgId = key == 'source' ? this.selectedSource : this.selectedTarget;
			getmetadatazips({
				sourceOrg: orgId,
				targetOrg: this.selectedTarget,
				metadataItemNames: JSON.stringify(resultArray),
			})
				.then((result) => {
					this.downloadFile(result, key);
					this.loaded = true;
				})
				.catch((error) => {
					console.error(error);
				});
		}
	}

	downloadFile(combinedZip, orgType) {
		const link = document.createElement("a");
		link.href = "data:application/zip;base64," + combinedZip;
		link.download = `${orgType}.zip`;
		link.click();
	}


	async handleCompare() {
		this.showCompareCard = false;
		this.selectedSourceitems = '';
		this.selectedTargetitems = '';
		this.loaded = false;
		let compareFile = [];
		let compareItem = this.selectedItems.find(item => item.Id === this.selectedRows[0]);
		if (compareItem) {
			compareItem.fullName = [compareItem.fullName];
			compareFile.push({
				fullName: compareItem.fullName,
				type: compareItem.metaDataType
			});
		} else {
		}
		try {
			let data1 = await getmetadatazips({
				sourceOrg: this.selectedSource,
				targetOrg: this.selectedTarget,
				metadataItemNames: JSON.stringify(compareFile)

			});
			let data2 = await getmetadatazips({
				sourceOrg: this.selectedTarget,
				targetOrg: this.selectedSource,
				metadataItemNames: JSON.stringify(compareFile)
			});
			const Sourcedata = data1;
			const Targetdata = data2;
			await this.handleProcessZip(Sourcedata, true);
			await this.handleProcessZip(Targetdata, false);
		} catch (error) {
			console.error('Error occurred during handleCompare:', error);
		}
	}

	comparisonApi() {
		const apiUrl = 'https://api.draftable.com/v1/comparisons';
		const authToken = 'babfc68844a1445c1e69302cf6313637';
		var blob1 = new Blob([this.selectedSourceitems], { type: 'text/plain' });
		var blob2 = new Blob([this.selectedTargetitems], { type: 'text/plain' });
		const formData = new FormData();
		formData.append('left.file_type', 'txt');
		formData.append('left.file', blob1, 'test1.text');
		formData.append('right.file_type', 'txt');
		formData.append('right.file', blob2, 'test2.text');
		formData.append('public', 'true');
		fetch(apiUrl, {
			method: 'POST',
			headers: {
				'Authorization': `Token ${authToken}`,
			},
			body: formData,
		})
			.then(response => response.json())
			.then(data => {
				this.url = 'https://api.draftable.com/v1/comparisons/viewer/Leefrc-test/' + data.identifier;
				this.showCompareCard = true;
				this.loaded = true;
				this.showToastMessage("Done", "Comparison done successfully", "success");
			})
			.catch(error => {
				console.error('Error:', error.message);
			});
	}
	async handleProcessZip(base64String, isSource) {
		try {
			const zip = new JSZip();
			const loadedZip = await zip.loadAsync(base64String, { base64: true });
			loadedZip.forEach(async (relativePath, zipEntry) => {
				if (relativePath !== 'package.xml' && !relativePath.includes('-meta.xml')) {
					const data = await zipEntry.async("string");
					if (data && isSource) {
						this.selectedSourceitems = data;
					} else if (data && !isSource) {
						this.selectedTargetitems = data;
					}
					if (this.selectedSourceitems && this.selectedTargetitems) {
						this.comparisonApi();
					}
				}
			});
		} catch (error) {
			console.error('Error loading ZIP:', error);
		}
	}


	validateOptionHandle(event) {
		this.TypeofValidation = event.target.value;
		if (this.TypeofValidation == 'RunSpecifiedTests') {
			this.testClassData = this.metadataDetails.source.filter(item => {
				return item.fullName.toLowerCase().includes('test')
			});
			this.isModalOpen = true;
		}
	}

	handleTestClassModal(event) {
		let countTestClassSelection = event.detail.selectedRows;
		this.fullNames = countTestClassSelection.map(item => item.fullName);
	}

	Closemodal() {
		this.isModalOpen = false;
	}
	handlePreviousCompare() {
		this.showCompareCard = false;
	}
}