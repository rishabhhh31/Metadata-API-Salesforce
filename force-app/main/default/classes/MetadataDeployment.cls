public class MetadataDeployment {
    private static final Integer METADATA_API_VERSION = Integer.valueOf(
        new MetadataService.MetadataPort().endpoint_x.substringAfterLast('/')
    );
    class MetadataItemWrapper{
        public List<String> fullname {get;set;}
        public String type {get;set;}
        public MetadataItemWrapper(String[] fullname, String type) {
            this.fullname.addAll(fullname);
            this.type = type;
        }
    }
    @AuraEnabled
    public static String deployMetadataItems(String sourceOrg, String targetOrg, String metadataItemNames,String TypeofValidation,List<String> testClassesToRun) {
        List<MetadataItemWrapper> listMetadataItems=(List<MetadataItemWrapper>)JSON.deserialize(metadataItemNames,List<MetadataItemWrapper>.class);
        List<String> base64Zips = new List<String>();
        try {
            base64Zips.add(
                retrieveMetadataItem(sourceOrg, listMetadataItems)
            );
            System.debug('base64Zips=>'+base64Zips);
        } catch (Exception e) {
            System.debug(e.getMessage());
            return 'Error retrieving metadata items: ' + e.getMessage();
        }
        if (base64Zips.isEmpty()) {
            return 'Retrieved metadata items are empty';
        }
        String combinedZip = combineZips(base64Zips);
        return deployZip(targetOrg, combinedZip,TypeofValidation,testClassesToRun);
    }
    @AuraEnabled
    public static String getmetadatazips(String sourceOrg, String targetOrg,  String metadataItemNames) {
        System.debug('metadataItemNames'+ metadataItemNames);
        List<MetadataItemWrapper> listMetadataItems=(List<MetadataItemWrapper>)JSON.deserialize(metadataItemNames,List<MetadataItemWrapper>.class);
        List<String> base64Zips = new List<String>();
        try {
            base64Zips.add(
                retrieveMetadataItem(sourceOrg, listMetadataItems)
            );
        } catch (Exception e) {
            System.debug(e.getMessage());
            return 'Error retrieving metadata items: ' + e.getMessage();
        }
        if (base64Zips.isEmpty()) {
            return 'Retrieved metadata items are empty';
        }
        String combinedZip = combineZips(base64Zips);    
        return combinedZip;
    }
    @AuraEnabled
    public static String combineZips(List<String> base64ZipList) {
        String combinedBlob = '';
        
        for (String base64Zip : base64ZipList) {
            if (base64Zip.length() > 0) {
                combinedBlob += base64Zip;
            }
        }
        return combinedBlob;
    }
    @AuraEnabled
    public static String retrieveMetadataItem(String sourceOrg, List<MetadataItemWrapper> listMetadataItemName) {
        MetadataService.MetadataPort service = createService('source', sourceOrg);
        MetadataService.RetrieveRequest retrieveRequest = new MetadataService.RetrieveRequest();
        retrieveRequest.apiVersion = METADATA_API_VERSION;
        retrieveRequest.singlePackage = true;
        retrieveRequest.packageNames = null;
        retrieveRequest.specificFiles = null;
        retrieveRequest.unpackaged = new MetadataService.Package_x();
        List<MetadataService.PackageTypeMembers> packageTypeMembersList = new List<MetadataService.PackageTypeMembers>();
        try{ 
            for (MetadataItemWrapper metadataItemName : listMetadataItemName) {
                MetadataService.PackageTypeMembers packageTypeMembers = new MetadataService.PackageTypeMembers();
                packageTypeMembers.name = metadataItemName.type;
                packageTypeMembers.members = new List<String>();
                packageTypeMembers.members.addAll(metadataItemName.fullname);
                packageTypeMembersList.add(packageTypeMembers);
            }
            System.debug('packageTypeMembersList'+packageTypeMembersList);
            
            retrieveRequest.unpackaged.types = packageTypeMembersList;
            MetadataService.AsyncResult asyncResult = service.retrieve(retrieveRequest);
            MetadataService.RetrieveResult retrieveResult;
            boolean done = false;
            while (!done) {
                retrieveResult = service.checkRetrieveStatus(asyncResult.Id, true);
                if (retrieveResult.done) {		
                    done = true;
                } else {
                    datetime start = System.now();
                    While(System.now()<start.addseconds(10)){}        
                }
            }
            return retrieveResult.zipFile;
        } catch (Exception e) {
            System.debug(e.getMessage());
            return 'Error retrieveMetadataItem: ' + e.getMessage();
        }
    }
    @AuraEnabled
    public static String deployZip(String targetOrg, String combinedZip, String TypeofValidation,List<String> testClassesToRun) {
        MetadataService.MetadataPort service = createService('target', targetOrg);
        MetadataService.DeployOptions deployOptions = new MetadataService.DeployOptions();
        deployOptions.allowMissingFiles = false;
        deployOptions.autoUpdatePackage = false;
        deployOptions.checkOnly = true; 
        deployOptions.ignoreWarnings = false;
        deployOptions.performRetrieve = false;
        deployOptions.purgeOnDelete = false;
        deployOptions.rollbackOnError = true;
        if (TypeofValidation.equals('NoTestRun') ) {
            deployOptions.testLevel = 'NoTestRun';
        }else if(TypeofValidation.equals('RunLocalTests')){
            deployOptions.testLevel = 'RunLocalTests';
        }else if (TypeofValidation.equals('RunSpecifiedTests')) {
            deployOptions.testLevel = 'RunSpecifiedTests';
            System.debug('testClassesToRun'+testClassesToRun);
            // deployOptions.runTests = testClassesToRun;
            deployOptions.runTests = testClassesToRun;
        }
        
        deployOptions.singlePackage = true;
        MetadataService.AsyncResult validationResult = service.deploy(combinedZip, deployOptions);
        String validationId = validationResult.Id;
        return validationId;
    }  
    @AuraEnabled
    public static String recentDeployment(String targetOrg, String valId){
        try{
            MetadataService.MetadataPort service = createService('target', targetOrg);
            String str=service.deployRecentValidation(valId);
            return JSON.serialize(str);
        }catch(Exception e){
            throw new AuraException(e.getMessage());
        }
    }
    
    
    @AuraEnabled
    public static String checkDeploymentStatus(String deploymentId, String targetOrg) {
        MetadataService.MetadataPort service = createService('target', targetOrg);
        MetadataService.DeployResult deployResult = service.checkDeployStatus(deploymentId, true);
        System.debug('deploymentId ' + JSON.serialize(deployResult));
        String statusMessage = JSON.serialize(deployResult);
        return statusMessage;
    }
    
    private static MetadataService.MetadataPort createService(String orgType,String orgId) {
        Authorized__c orgRecord = [ SELECT access_token__c, instance_url__c FROM Authorized__c WHERE Id = :orgId];
        String accessToken = orgRecord.access_token__c;
        String instanceUrl = orgRecord.instance_url__c;
        MetadataService.MetadataPort service = new MetadataService.MetadataPort();
        service.endpoint_x = instanceUrl +'/services/Soap/m/' + METADATA_API_VERSION;
        service.SessionHeader = new MetadataService.SessionHeader_element();
        service.SessionHeader.sessionId = accessToken;
        return service;
    }
    @AuraEnabled
    public static void getSourceApexTestClass(String sourceId){
        String endpoint = '/services/data/v51.0/tooling/query/?q=';
        String urlString = endpoint + EncodingUtil.urlEncode('SELECT Id, Name, Body FROM ApexClass', 'UTF-8');
        Authorized__c orgRecord = [ SELECT access_token__c, instance_url__c FROM Authorized__c WHERE Id = :sourceId];
        HttpRequest req = new HttpRequest();
        req.setHeader('Authorization', 'Bearer ' + orgRecord.access_token__c);
        req.setHeader('Content-Type', 'application/json');
        req.setEndpoint(orgRecord.instance_url__c+urlString);
        req.setMethod('GET');
        Http h = new Http();
        HttpResponse res = h.send(req);
        system.debug(res.getBody());
    }
}