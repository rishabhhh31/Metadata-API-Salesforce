@isTest
private class TestClassApex {
    @TestSetup
    static void sampleData(){
        SampleApexClass.helloWorld();
    }
	@IsTest
    static void testRunClass(){
        List<Account> accList = [SELECT Id from Account];
        Assert.areEqual(1,accList.size());
    }
}