@isTest
public class AccountHandlerTest {
	@isTest
    static void checkAccount(){
        Account acc=new Account();
        acc.Name='Test Validation';
        AccountHandler.newAccount(acc);
        List<Account> accList=[SELECT Id from Account LIMIT 1];
        Assert.areEqual(1, accList.size());
    }
}