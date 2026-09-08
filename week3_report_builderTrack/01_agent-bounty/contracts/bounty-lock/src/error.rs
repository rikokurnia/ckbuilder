use ckb_std::error::SysError;

#[repr(i8)]
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
#[allow(dead_code)]
pub enum Error {
    IndexOutOfBound = 1,
    ItemMissing = 2,
    LengthNotEnough = 3,
    Encoding = 4,
    UnknownSysError = 5,
    // Custom AgentBounty Contract Errors
    EmptyArgs = 10,
    InvalidArgsLength = 11,
    InvalidCapacityBalance = 12,
    InvalidPreimage = 13,
    WitnessMissing = 14,
    TimeoutNotReached = 15,
    UnauthorizedClaim = 16,
    UnknownUnlockMode = 17,
}

impl From<SysError> for Error {
    fn from(err: SysError) -> Self {
        match err {
            SysError::IndexOutOfBound => Self::IndexOutOfBound,
            SysError::ItemMissing => Self::ItemMissing,
            SysError::LengthNotEnough(_) => Self::LengthNotEnough,
            SysError::Encoding => Self::Encoding,
            _ => Self::UnknownSysError,
        }
    }
}
