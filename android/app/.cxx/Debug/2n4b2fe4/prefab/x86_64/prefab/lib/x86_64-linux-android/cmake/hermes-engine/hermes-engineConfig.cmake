if(NOT TARGET hermes-engine::libhermes)
add_library(hermes-engine::libhermes SHARED IMPORTED)
set_target_properties(hermes-engine::libhermes PROPERTIES
    IMPORTED_LOCATION "C:/Users/abhay/.gradle/caches/8.10.2/transforms/2ddc2974fd37f3d2663d8d21927f2ae2/transformed/hermes-android-0.76.1-debug/prefab/modules/libhermes/libs/android.x86_64/libhermes.so"
    INTERFACE_INCLUDE_DIRECTORIES "C:/Users/abhay/.gradle/caches/8.10.2/transforms/2ddc2974fd37f3d2663d8d21927f2ae2/transformed/hermes-android-0.76.1-debug/prefab/modules/libhermes/include"
    INTERFACE_LINK_LIBRARIES ""
)
endif()

