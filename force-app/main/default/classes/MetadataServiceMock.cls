@isTest
public class MetadataServiceMock implements WebServiceMock {
    public void doInvoke(
        Object stub,
        Object request,
        Map<String, Object> response,
        String endpoint,
        String soapAction,
        String requestName,
        String responseNS,
        String responseName,
        String responseType
    ) {
        // Simulate response for MetadataService methods
        if (request instanceof MetadataService.RetrieveRequest) {
            MetadataService.RetrieveResult result = new MetadataService.RetrieveResult();
            result.done = true;
            result.zipFile = 'MockedZipFile';
            response.put('response_x', result);
        } else if (request instanceof MetadataService.DeployOptions) {
            MetadataService.AsyncResult asyncResult = new MetadataService.AsyncResult();
            asyncResult.Id = 'MockedDeploymentId';
            response.put('response_x', asyncResult);
        } else if (request instanceof MetadataService.DeployResult) {
            MetadataService.DeployResult deployResult = new MetadataService.DeployResult();
            deployResult.done = true;
            deployResult.status = 'Succeeded';
            response.put('response_x', deployResult);
        }
    }
}