pragma solidity ^0.8.0;

interface IERC721 {
    function balanceOf(address owner) external view returns (uint256 balance);
}

contract Membership {
    address public nftAddress = 0xd07dc4262BCDbf85190C01c996b4C06a461d2430; // 9 WIZARDS NFT contract address

    struct Member {
        address addr;
        string role;
        bool active;
    }

    mapping(address => Member) public members;
    address[] public memberAddresses;

    IERC721 nftContract;

    constructor() {
        nftContract = IERC721(nftAddress);
    }

    modifier onlyNFTHolder() {
        require(nftContract.balanceOf(msg.sender) > 0, "Not an NFT holder");
        _;
    }

    function addMember(string memory _role) public onlyNFTHolder {
        require(!members[msg.sender].active, "Member already exists");
        members[msg.sender] = Member(msg.sender, _role, true);
        memberAddresses.push(msg.sender);
    }

    function removeMember(address _addr) public onlyNFTHolder {
        require(members[_addr].active, "Member does not exist");
        members[_addr].active = false;
    }

    function getMembers() public view returns (address[] memory) {
        return memberAddresses;
    }
}
