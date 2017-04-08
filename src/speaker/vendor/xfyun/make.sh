whether_32bit_or_64bit=`uname -m`

if [ "$whether_32bit_or_64bit" = "x86_64" ]; then

    #编译64位可执行文件
    make clean;make LINUX64=1
    #设置libmsc.so库搜索路径
    export LD_LIBRARY_PATH=$(pwd)/libs/x64/

else

    #编译32位可执行文件
    make clean;make
    #设置libmsc.so库搜索路径
    export LD_LIBRARY_PATH=$(pwd)/libs/x86/

fi