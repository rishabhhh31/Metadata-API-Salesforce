public class MetadataTypesRetriever {
    private static final Integer METADATA_API_VERSION = Integer.valueOf(new MetadataService.MetadataPort().endpoint_x.substringAfterLast('/'));
    public class MetadataTypeWrapper {
        @AuraEnabled
        public String MetaDataType { get; set; }
        @AuraEnabled
        public String label { get; set; }
        @AuraEnabled
        public String value { get; set; }
        public MetadataTypeWrapper(String label, String value) {
            this.label = label;
            this.value = value;
        }
    }
    public class MetadataItemWrapper {
        @AuraEnabled
        public String fullName { get; set; }
        @AuraEnabled
        public String decodedFullName { get; set; }
        @AuraEnabled
        public String metaDataType { get; set; }
        @AuraEnabled
        public DateTime lastModifiedDate { get; set; }
        public MetadataItemWrapper(
            String fullName,
            String decodedFullName,
            String metaDataType,
            DateTime lastModifiedDate
            
        ) {
            this.fullName = fullName;
            this.decodedFullName = decodedFullName;
            this.metaDataType = metaDataType;
            this.lastModifiedDate = lastModifiedDate;
            
        }
    }
    @AuraEnabled
    public static List<MetadataTypeWrapper> getMetadataTypes(String sourceOrgId,String targetOrgId) {
        List<MetadataTypeWrapper> metadataTypes = new List<MetadataTypeWrapper>();
        List<Authorized__c> sourceOrgs = [ SELECT access_token__c, instance_url__c FROM Authorized__c WHERE Id = :sourceOrgId];
        try{
            if (!sourceOrgs.isEmpty()) {
                Authorized__c sourceOrg = sourceOrgs[0];
                MetadataService.MetadataPort sourceService = createService(sourceOrg.access_token__c, sourceOrg.instance_url__c);
                MetadataService.DescribeMetadataResult sourceDescribeResult = sourceService.describeMetadata(METADATA_API_VERSION );
                List<String> metadataTypeNames = new List<String>();
                for (
                    MetadataService.DescribeMetadataObject metadataObject : sourceDescribeResult.metadataObjects
                ) {
                    metadataTypeNames.add(metadataObject.xmlName);
                    if (metadataObject.childXmlNames != null) {
                        metadataTypeNames.addAll(metadataObject.childXmlNames);
                    }
                }
                metadataTypeNames.sort();
                for (String metadataTypeName : metadataTypeNames) {
                    metadataTypes.add(new MetadataTypeWrapper(metadataTypeName, metadataTypeName));
                }
            } else {
                System.debug('No records found for the provided org Ids');
            }
        } catch(exception e){
            System.debug('Error in getMetadataTypes method:'+e);
        }
        return metadataTypes;
    }
    @AuraEnabled
    public static Map<String, List<MetadataItemWrapper>> getSelectedMetadataItemsForOrgs(List<String> selectedTypes, Boolean isSourceOrg, String sourceOrgId, String targetOrgId) {
        Map<String, List<MetadataItemWrapper>> selectedMetadataItemsMap = new Map<String, List<MetadataItemWrapper>>();
        try{
            List<MetadataItemWrapper> sourceMetadataItems = getSelectedMetadataItems(selectedTypes, isSourceOrg, sourceOrgId, targetOrgId);
            selectedMetadataItemsMap.put('source', sourceMetadataItems);
            List<MetadataItemWrapper> targetMetadataItems = getSelectedMetadataItems(selectedTypes, !isSourceOrg, sourceOrgId, targetOrgId);
            selectedMetadataItemsMap.put('target', targetMetadataItems);
        } catch(exception e){
            System.debug('Error in getSelectedMetadataItemsForOrgs method:'+e);
        }
        return selectedMetadataItemsMap;
    }
    @AuraEnabled(cacheable = true)
    public static List<MetadataItemWrapper> getSelectedMetadataItems(List<String> selectedTypes, Boolean isSourceOrg, String sourceOrgId, String targetOrgId) {
        List<MetadataItemWrapper> metadataItems = new List<MetadataItemWrapper>();
        if (selectedTypes != null && !selectedTypes.isEmpty()) {
            String orgId = isSourceOrg ? sourceOrgId : targetOrgId;
            List<Authorized__c> orgs = [SELECT access_token__c, instance_url__c FROM Authorized__c WHERE Id = :orgId ];
            if (!orgs.isEmpty()) {
                Authorized__c orgRecord = orgs[0];
                MetadataService.MetadataPort service = createService( orgRecord.access_token__c,  orgRecord.instance_url__c );
                List<MetadataService.ListMetadataQuery> queries = new List<MetadataService.ListMetadataQuery>();
                for (String metaDataType : selectedTypes) {
                    MetadataService.ListMetadataQuery query = new MetadataService.ListMetadataQuery();
                    query.type_x = metaDataType;
                    queries.add(query);
                }
                MetadataService.FileProperties[] fileProperties = service.listMetadata(queries, METADATA_API_VERSION);
                if (fileProperties != null) {
                    for (MetadataService.FileProperties fileProperty : fileProperties) {
                        metadataItems.add( new MetadataItemWrapper(fileProperty.fullName, EncodingUtil.urlDecode(fileProperty.fullName, 'UTF-8'),fileProperty.type_x,fileProperty.lastModifiedDate
                                                                  ));
                    }
                }
            }   else {
                System.debug('No records found for the provided org Id');
            }
        }
        return metadataItems;
    }
    private static MetadataService.MetadataPort createService(String accessToken, String instanceUrl) {
        MetadataService.MetadataPort service = new MetadataService.MetadataPort();
        try{
            if (instanceUrl != null) {
                String endpoint_x = instanceUrl + '/services/Soap/m/' + METADATA_API_VERSION;
                service.endpoint_x = endpoint_x;
            }
            service.SessionHeader = new MetadataService.SessionHeader_element();
            service.SessionHeader.sessionId = accessToken;	
        } catch(exception e){
            System.debug('Error in createService method:'+e);
        }
        return service;
    }
}