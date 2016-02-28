
function Write-Item($itemCount)
{
    $i = 1
    
    while ($i -le $itemCount)
    {
        $str = "Output $i"
        Write-Output $str
        $i = $i + 1
    }
}

function Do-Work($workCount)
{
    Write-Output "Doing work..."

    Write-Item $workcount
    
    Write-Host "Done!"
}

Do-Work 5000000
